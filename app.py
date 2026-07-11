"""
=============================================================================
Audio Signal Processing Assistant - Flask Backend
=============================================================================
IBM Watsonx.ai powered AI assistant for audio electronics engineering.
Uses IBM Granite foundation models via the watsonx.ai SDK.
=============================================================================
"""

import os
import logging
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# ---------------------------------------------------------------------------
# Load environment variables from .env file
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Flask Application Setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "audio-signal-processing-secret-2024")

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# IBM Watsonx.ai Configuration
# ---------------------------------------------------------------------------
IBM_API_KEY    = os.getenv("IBM_API_KEY", "")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID", "")
IBM_URL        = os.getenv("IBM_URL", "https://us-south.ml.cloud.ibm.com")
IBM_MODEL_ID   = os.getenv("IBM_MODEL_ID", "ibm/granite-13b-chat-v2")

# Log credential presence at startup (values are never logged, only presence)
logging.getLogger(__name__).info(
    "Credential check — IBM_API_KEY: %s, IBM_PROJECT_ID: %s",
    "SET" if IBM_API_KEY else "MISSING",
    "SET" if IBM_PROJECT_ID else "MISSING",
)

# ---------------------------------------------------------------------------
# AGENT INSTRUCTIONS
# Modify this section to customise the AI assistant's personality, tone,
# engineering depth, response style, safety rules, and supported topics.
# ---------------------------------------------------------------------------
AGENT_INSTRUCTIONS = """
You are an expert AI Audio Signal Processing Assistant built by IBM Granite AI.
You specialise in helping students, electronics engineers, hobbyists, and audio
designers troubleshoot, analyse, and design audio signal processing circuits.

PERSONALITY & TONE:
- Professional, precise, and encouraging
- Patient with beginners; technically deep for advanced users
- Always use correct engineering terminology
- Be concise but thorough — avoid unnecessary padding

ENGINEERING DEPTH:
- Provide real component values, formulas, and calculations when asked
- Reference industry standards (IEC, IEEE, AES) where relevant
- Include practical PCB layout tips when discussing circuit design
- Always mention tolerance, thermal considerations, and power ratings

SUPPORTED TOPICS:
- Audio Amplifiers (Class A, B, AB, D, H)
- Operational Amplifiers & Instrumentation Amplifiers
- Audio Filters (Low Pass, High Pass, Band Pass, Notch, Butterworth, Chebyshev)
- Noise Reduction, Ground Loops, EMI, Shielding
- PCB Design for audio circuits
- Audio Frequency Response, Distortion, Harmonic Distortion, Clipping
- Gain, Feedback, Bandwidth, Slew Rate
- Speaker Protection & Microphone Circuits
- Audio Equalizers, Mixers, and Signal Routing
- Component Selection (Op-Amps, Audio ICs, Passives, Transistors)
- Learning Mode: CMRR, PSRR, THD, SNR, Slew Rate, etc.

RESPONSE FORMAT — always structure your reply exactly as follows:

**🔍 Problem**
[Restate the problem briefly]

**⚠️ Possible Causes**
[List each cause as a bullet point]

**🔬 Diagnosis**
[Step-by-step diagnostic process]

**✅ Recommended Solution**
[Clear actionable solution steps]

**💡 Engineering Tips**
[Practical industry-grade recommendations]

**📐 Formula** *(if applicable)*
[Relevant equations with variable definitions]

**🔩 Component Recommendation** *(if applicable)*
[Specific part numbers, values, and sourcing notes]

**🛡️ Safety Notes**
[Relevant electrical safety and ESD precautions]

SAFETY RULES:
- Always warn about mains voltage (>50 V AC / >120 V DC) hazards
- Remind users to discharge capacitors before working on power stages
- Advise ESD precautions for sensitive ICs
- Never recommend bypassing protection circuits in live audio equipment
- If unsure, recommend consulting a qualified electronics engineer

If the question is outside audio electronics, politely decline and redirect
the user to ask an audio-related engineering question.
"""

# ---------------------------------------------------------------------------
# Watsonx.ai Model Initialisation
# ---------------------------------------------------------------------------
def get_watsonx_model() -> ModelInference | None:
    """Initialise and return an IBM Watsonx.ai ModelInference instance."""
    if not IBM_API_KEY or not IBM_PROJECT_ID:
        logger.warning("IBM_API_KEY or IBM_PROJECT_ID is not set.")
        return None
    try:
        credentials = Credentials(
            api_key=IBM_API_KEY,
            url=IBM_URL,
        )
        model = ModelInference(
            model_id=IBM_MODEL_ID,
            credentials=credentials,
            project_id=IBM_PROJECT_ID,
            params={
                GenParams.MAX_NEW_TOKENS: 1024,
                GenParams.MIN_NEW_TOKENS: 50,
                GenParams.TEMPERATURE: 0.7,
                GenParams.TOP_P: 0.9,
                GenParams.TOP_K: 50,
                GenParams.REPETITION_PENALTY: 1.1,
            },
        )
        logger.info("Watsonx.ai model initialised: %s", IBM_MODEL_ID)
        return model
    except Exception as exc:
        logger.error("Failed to initialise Watsonx.ai model: %s", exc)
        return None


# Initialise model at startup
watsonx_model = get_watsonx_model()


# ---------------------------------------------------------------------------
# Helper: Build the full prompt
# ---------------------------------------------------------------------------
def build_prompt(user_message: str, conversation_history: list) -> str:
    """
    Construct a structured prompt that combines the agent instructions,
    conversation history, and the latest user message.
    """
    history_text = ""
    for turn in conversation_history[-6:]:          # keep last 3 exchanges
        role    = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "user":
            history_text += f"\nUser: {content}"
        elif role == "assistant":
            history_text += f"\nAssistant: {content}"

    prompt = (
        f"{AGENT_INSTRUCTIONS}\n"
        f"{'=' * 60}\n"
        f"Conversation History:{history_text}\n"
        f"{'=' * 60}\n"
        f"User: {user_message}\n"
        f"Assistant:"
    )
    return prompt


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Render the landing page."""
    return render_template("index.html")


@app.route("/chat")
def chat():
    """Render the chat interface page."""
    return render_template("chat.html")


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    REST API endpoint for chat interactions.

    Expects JSON body:
        {
            "message": "user question string",
            "history": [{"role": "user"|"assistant", "content": "..."}]
        }

    Returns JSON:
        {
            "response": "AI answer string",
            "status": "success" | "error",
            "model": "model-id"
        }
    """
    try:
        data    = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()
        history = data.get("history", [])

        if not message:
            return jsonify({"status": "error", "response": "Message cannot be empty."}), 400

        logger.info("Received chat request: %.80s ...", message)

        # ---- Call Watsonx.ai -----------------------------------------------
        if watsonx_model is None:
            # Fallback demo response when credentials are not configured
            response_text = _demo_response(message)
        else:
            prompt   = build_prompt(message, history)
            response = watsonx_model.generate_text(prompt=prompt)
            response_text = response.strip() if isinstance(response, str) else str(response)

        logger.info("Response generated (%d chars).", len(response_text))
        return jsonify({
            "status":   "success",
            "response": response_text,
            "model":    IBM_MODEL_ID,
        })

    except Exception as exc:
        logger.error("Error in /api/chat: %s", exc, exc_info=True)
        return jsonify({
            "status":   "error",
            "response": "An internal error occurred. Please try again.",
            "error":    str(exc),
        }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return jsonify({
        "status":      "healthy",
        "model":       IBM_MODEL_ID,
        "model_ready": watsonx_model is not None,
        "version":     "1.0.0",
    })


# ---------------------------------------------------------------------------
# Demo fallback (used when IBM credentials are not yet configured)
# ---------------------------------------------------------------------------
def _demo_response(message: str) -> str:
    """
    Return a structured demo response so the UI works without live credentials.
    Replace this with a real model call once IBM_API_KEY is set.
    """
    return (
        "**🔍 Problem**\n"
        f"You asked: *{message}*\n\n"
        "**⚠️ Possible Causes**\n"
        "• IBM Watsonx.ai credentials are not yet configured in the `.env` file.\n\n"
        "**🔬 Diagnosis**\n"
        "The application is running in **demo mode** because `IBM_API_KEY` or "
        "`IBM_PROJECT_ID` environment variables are missing.\n\n"
        "**✅ Recommended Solution**\n"
        "1. Copy `.env.example` → `.env`\n"
        "2. Add your IBM Cloud API Key, Project ID, URL, and Model ID\n"
        "3. Restart the Flask server\n\n"
        "**💡 Engineering Tips**\n"
        "Once configured, ask anything about amplifiers, filters, noise reduction, "
        "PCB design, op-amps, and more!\n\n"
        "**🛡️ Safety Notes**\n"
        "Always ensure credentials are kept private and never committed to source control."
    )


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting Audio Signal Processing Assistant on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
