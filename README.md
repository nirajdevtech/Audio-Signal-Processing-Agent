<<<<<<< HEAD
# 🎵 Audio Signal Processing Assistant

> **AI-powered audio electronics engineering assistant built with Python Flask and IBM Watsonx.ai (IBM Granite foundation models).**

Designed for students, electronics engineers, hobbyists, and audio designers who want to troubleshoot, analyse, and design audio signal processing circuits using the power of generative AI.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [IBM Cloud Setup](#-ibm-cloud-setup)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Customising the AI Agent](#-customising-the-ai-agent)
- [Screenshots](#-screenshots)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Assistant** | Natural language Q&A for audio engineering problems |
| 🔩 **Circuit Diagnosis** | Cause analysis, diagnosis steps, and recommended solutions |
| 🔩 **Filter Designer** | Formulas, component values, and circuit explanations |
| ⚡ **Audio Troubleshooter** | Fixes buzzing, hum, oscillation, clipping, ground loops |
| 📐 **Component Recommendation** | Op-amps, audio ICs, capacitors, resistors, transistors |
| 📚 **Learning Mode** | Explains CMRR, PSRR, THD, SNR, slew rate, and more |
| 💡 **Engineering Tips** | Practical industry-grade PCB and circuit design advice |
| 🌙 **Dark Mode** | Toggle between light and dark themes |
| 📱 **Responsive UI** | Works on desktop, tablet, and mobile |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, Flask 3.0 |
| **AI Model** | IBM Watsonx.ai — IBM Granite (`ibm/granite-13b-chat-v2`) |
| **AI SDK** | `ibm-watsonx-ai` Python SDK |
| **Frontend** | HTML5, Bootstrap 5.3, Bootstrap Icons |
| **Markdown** | Marked.js (client-side rendering) |
| **Config** | python-dotenv `.env` file |
| **Deployment** | Gunicorn (WSGI), IBM Cloud, Heroku, Railway |

---

## 📁 Project Structure

```
audio-signal-processing-assistant/
│
├── app.py                    # Flask backend + IBM Watsonx.ai integration
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variable template
├── .env                      # Your credentials (DO NOT commit)
├── .gitignore                # Git ignore rules
├── README.md                 # This file
│
├── templates/
│   ├── index.html            # Landing page
│   └── chat.html             # Chat interface
│
└── static/
    ├── style.css             # Master stylesheet (light + dark mode)
    ├── script.js             # Chat engine, dark mode, UI logic
    └── images/               # Static image assets
```

---

## ☁️ IBM Cloud Setup

### Step 1 — Create an IBM Cloud Account

1. Go to [cloud.ibm.com](https://cloud.ibm.com/registration) and register for a **free Lite account**.

### Step 2 — Create an IBM Watsonx.ai Project

1. Navigate to [dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com)
2. Click **New project** → **Create an empty project**
3. Enter a project name (e.g. `Audio AI Assistant`)
4. Copy the **Project ID** from the project settings page

### Step 3 — Get Your API Key

1. Go to [cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys)
2. Click **Create an IBM Cloud API key**
3. Give it a name and copy the key immediately (it won't be shown again)

### Step 4 — Note the Service URL

- **US South (default):** `https://us-south.ml.cloud.ibm.com`
- **EU DE:** `https://eu-de.ml.cloud.ibm.com`
- **JP Tok:** `https://jp-tok.ml.cloud.ibm.com`

Use the URL that matches your Watsonx.ai instance region.

### Step 5 — Choose a Granite Model

Recommended for Lite accounts:
```
ibm/granite-13b-chat-v2
```

Other available models:
```
ibm/granite-3-8b-instruct
ibm/granite-7b-lab
```

---

## ⚙️ Installation

### Prerequisites

- Python 3.10 or higher
- `pip` package manager
- IBM Cloud account with Watsonx.ai access

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/audio-signal-processing-assistant.git
cd audio-signal-processing-assistant
```

### 2. Create a Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Then open `.env` and fill in your IBM credentials (see next section).

---

## 🔑 Environment Variables

Edit the `.env` file with your IBM Cloud details:

```env
# IBM Cloud API Key (from IBM IAM)
IBM_API_KEY=your_ibm_cloud_api_key_here

# Watsonx.ai Project ID
IBM_PROJECT_ID=your_watsonx_project_id_here

# Watsonx.ai Service URL (region-specific)
IBM_URL=https://us-south.ml.cloud.ibm.com

# IBM Granite Model ID
IBM_MODEL_ID=ibm/granite-13b-chat-v2

# Flask settings (optional)
FLASK_SECRET_KEY=change-this-to-a-random-secret
FLASK_DEBUG=false
PORT=5000
```

> ⚠️ **Never commit your `.env` file to version control.** Add `.env` to your `.gitignore`.

---

## 🚀 Running the Application

### Development Server

```bash
python app.py
```

Open your browser at: **http://localhost:5000**

### With Gunicorn (Production)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 🌐 Deployment

### Option 1 — IBM Cloud Code Engine

```bash
# Install IBM Cloud CLI
ibmcloud login --apikey $IBM_API_KEY -r us-south

# Create and deploy
ibmcloud ce project create --name audio-ai-assistant
ibmcloud ce app create \
  --name audio-ai-assistant \
  --image us.icr.io/your-namespace/audio-ai:latest \
  --env-from-secret audio-ai-secrets
```

### Option 2 — Railway (Recommended for Quick Deploy)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Add environment variables in the Railway dashboard
4. Railway auto-detects Python and deploys

### Option 3 — Heroku

```bash
# Create Procfile
echo "web: gunicorn app:app" > Procfile

heroku create audio-ai-assistant
heroku config:set IBM_API_KEY=your_key
heroku config:set IBM_PROJECT_ID=your_project_id
heroku config:set IBM_URL=https://us-south.ml.cloud.ibm.com
heroku config:set IBM_MODEL_ID=ibm/granite-13b-chat-v2
git push heroku main
```

### Option 4 — Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

```bash
docker build -t audio-ai-assistant .
docker run -p 5000:5000 --env-file .env audio-ai-assistant
```

---

## 🔌 API Reference

### `POST /api/chat`

Send a user message and receive an AI response.

**Request Body:**
```json
{
  "message": "Why is my amplifier humming?",
  "history": [
    { "role": "user",      "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}
```

**Response:**
```json
{
  "status":   "success",
  "response": "**🔍 Problem**\n...",
  "model":    "ibm/granite-13b-chat-v2"
}
```

### `GET /api/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status":      "healthy",
  "model":       "ibm/granite-13b-chat-v2",
  "model_ready": true,
  "version":     "1.0.0"
}
```

---

## 🧠 Customising the AI Agent

The AI agent's personality, tone, engineering depth, and safety rules are fully configurable in [`app.py`](app.py) inside the `AGENT_INSTRUCTIONS` constant:

```python
AGENT_INSTRUCTIONS = """
You are an expert AI Audio Signal Processing Assistant...

PERSONALITY & TONE:
- Professional, precise, and encouraging
...

RESPONSE FORMAT:
**🔍 Problem**
**⚠️ Possible Causes**
**🔬 Diagnosis**
**✅ Recommended Solution**
**💡 Engineering Tips**
**📐 Formula**
**🔩 Component Recommendation**
**🛡️ Safety Notes**
...
"""
```

You can:
- Change the assistant's **name or persona**
- Adjust **engineering depth** (beginner vs. expert)
- Modify the **response format**
- Add or remove **supported topics**
- Update **safety rules**

---

## 🛡️ Security Notes

- Store all secrets in `.env` — never hardcode credentials
- Add `.env` to `.gitignore` before your first commit
- Rotate your IBM Cloud API key regularly
- Use environment variables in all deployment platforms

---

## 📄 .gitignore Recommendation

```
.env
venv/
__pycache__/
*.pyc
*.pyo
.DS_Store
*.log
```

---

## 📜 License

MIT License — Free for personal, educational, and commercial use.

---

## 🤝 Acknowledgements

- **IBM Watsonx.ai** — Foundation model platform
- **IBM Granite** — Open-source AI foundation models by IBM Research
- **IBM SkillsBuild** — Training and internship program
- **Bootstrap** — UI framework
- **Marked.js** — Markdown rendering

---

*Built with ❤️ for IBM SkillsBuild Internship & Hackathons*
=======
# Audio-Signal-Processing-Agent
>>>>>>> 11d4efc955d22b5e20f753f2c9c29ccb377ac220
