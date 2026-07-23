import os
import sys
from pathlib import Path

# Limit thread pool allocations to prevent OOM on 512MB RAM instances
os.environ["ONNX_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

# Ensure the backend root is on the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
    RoomInputOptions,
)
from livekit.plugins import silero, deepgram
from livekit.plugins import groq as groq_plugin
from graph.builder import graph
from langchain_core.messages import HumanMessage


# ---------------------------------------------------------------------------
# Voice Agent
# ---------------------------------------------------------------------------
class BankingVoiceAgent(Agent):
    """
    AI Banking Voice Assistant using LangGraph Multi-Agent Pipeline.

    Uses Groq for LLM (llama-3.3-70b), Deepgram for STT and TTS,
    Silero for VAD, and routes queries through LangGraph (Planner -> DB/RAG -> Responder).
    """

    def __init__(self):
        super().__init__(
            instructions="""
            You are a friendly and knowledgeable AI Banking Assistant.
            You help customers with:
            - Account balances and transaction history
            - Fund transfers and payments
            - Loan and credit card inquiries
            - General banking policies and procedures
            - Branch locations and working hours

            IMPORTANT — voice guidelines:
            - Keep every response SHORT and conversational (2-4 sentences max).
            - Never use bullet points, markdown, or special characters — speak naturally.
            - If a task is complex, acknowledge it and offer to guide step-by-step.
            - Always maintain a professional, warm, and reassuring tone.
            """,
        )

    async def llm_node(self, chat_ctx, tools, model_settings):
        """
        Overrides the LLM generation node in the LiveKit pipeline to route queries
        through the enterprise LangGraph multi-agent pipeline (Planner -> DB/RAG -> Responder).
        """
        user_query = ""
        if chat_ctx and hasattr(chat_ctx, "messages"):
            msg_list = chat_ctx.messages() if callable(chat_ctx.messages) else chat_ctx.messages
            for msg in reversed(msg_list):
                role = str(getattr(msg, "role", "")).lower()
                if "user" in role or "human" in role:
                    text = getattr(msg, "text_content", None) or getattr(msg, "raw_text_content", None)
                    if not text and hasattr(msg, "content"):
                        content = msg.content
                        if isinstance(content, str):
                            text = content
                        elif isinstance(content, list):
                            text_parts = [
                                str(c) if isinstance(c, str) else getattr(c, "text", str(c))
                                for c in content
                            ]
                            text = " ".join(text_parts)
                    if text and text.strip():
                        user_query = text.strip()
                        break

        if not user_query:
            async for chunk in Agent.default.llm_node(self, chat_ctx, tools, model_settings):
                yield chunk
            return

        state = {
            "messages": [
                HumanMessage(content=user_query)
            ],
            "plan": [],
            "tool_results": [],
            "answer": ""
        }

        try:
            result = await graph.ainvoke(
                state,
                config={
                    "configurable": {
                        "thread_id": f"voice_{getattr(self.session, 'id', 'default')}"
                    }
                }
            )

            answer = result.get("answer", "")
            if answer:
                yield answer
            else:
                async for chunk in Agent.default.llm_node(self, chat_ctx, tools, model_settings):
                    yield chunk
        except Exception as e:
            print(f"[VoiceAgent] Error executing LangGraph pipeline in llm_node: {e}")
            async for chunk in Agent.default.llm_node(self, chat_ctx, tools, model_settings):
                yield chunk


# ---------------------------------------------------------------------------
# Entry point for the LiveKit worker
# ---------------------------------------------------------------------------
async def entrypoint(ctx: JobContext):
    await ctx.connect()

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=groq_plugin.LLM(
            model=os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
        ),
        tts=deepgram.TTS(
            model="aura-asteria-en",
        ),
    )

    await session.start(
        room=ctx.room,
        agent=BankingVoiceAgent(),
        room_input_options=RoomInputOptions(),
    )

    await session.generate_reply(
        instructions=(
            "Warmly greet the user and introduce yourself as the AI Banking Assistant. "
            "Let them know they can speak naturally. Keep it under two sentences."
        )
    )


import threading
from http.server import HTTPServer, BaseHTTPRequestHandler


class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, format, *args):
        return


def start_health_check_server():
    port = os.getenv("PORT")
    if port:
        try:
            server = HTTPServer(("0.0.0.0", int(port)), HealthCheckHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            print(f"[HealthCheck] Bound health check HTTP server to port {port}")
        except Exception as e:
            print(f"[HealthCheck] Could not bind health check server: {e}")


if __name__ == "__main__":
    start_health_check_server()
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            plugins=[
                silero.Plugin(),
                deepgram.Plugin(),
                groq_plugin.Plugin(),
            ],
        )
    )