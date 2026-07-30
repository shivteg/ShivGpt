# ⚡ Groq ChatGPT AI - Next.js AI Web App

A high-performance, ChatGPT-style web interface powered by **Groq Cloud API** and Meta/DeepSeek open models (**Llama 3.3 70B**, **Llama 3.1 8B**, **DeepSeek R1 Distill**). Built with Next.js 14, TypeScript, Tailwind CSS, and Lucide Icons. Ready for 1-click deployment on **Vercel**.

---

## 🌟 Key Features

- ⚡ **Ultra-Fast Groq Inference**: Real-time responses up to 800+ tokens/sec.
- 🤖 **Multi-Model Selector**: Switch between Meta Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 Distill 70B, Mixtral 8x7b, and Gemma 2.
- 🎨 **ChatGPT UI & Dark Mode**: Sleek glassmorphism theme, markdown support, syntax highlighting, and copy-code buttons.
- 📊 **Performance Analytics**: Live tokens/sec counter, completion tokens count, and API latency badges.
- ⚙️ **Customizable Settings**: Modify system prompts, temperature, max tokens, or enter local API key overrides.
- 💬 **Chat Management**: Create new chats, rename threads, clear history, with full `localStorage` persistence.
- 🌐 **Vercel Ready**: Edge serverless architecture configured for zero-setup Vercel deployment.

---

## 🚀 How to Deploy on Vercel

### Step 1: Get Your Free Groq API Key
1. Go to [Groq Console API Keys](https://console.groq.com/keys).
2. Sign in and click **Create API Key**.
3. Copy your API key (looks like `gsk_...`).

### Step 2: Deploy to Vercel
1. Push this repository to your **GitHub / GitLab / Bitbucket** account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. Under **Environment Variables**, add:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `gsk_your_groq_api_key_here`
4. Click **Deploy**! 🎉

---

## 💻 Local Development Setup

If you want to run this application locally on your computer:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd groq-chatgpt-ai

# 2. Install dependencies
npm install

# 3. Create .env.local file and set your Groq API key
echo "GROQ_API_KEY=gsk_your_groq_api_key_here" > .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```
groq-chatgpt-ai/
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/        # Groq API route integration
│   │   │   └── models/      # Groq model list endpoint
│   │   ├── globals.css      # Custom styling & glassmorphism theme
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main chat dashboard
│   ├── components/          # Reusable UI components
│   │   ├── ChatInterface.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── SettingsModal.tsx
│   │   └── Sidebar.tsx
│   └── lib/                 # Types, constants & Groq model metadata
├── .env.example             # Example environment variables
├── vercel.json              # Vercel deployment config
├── package.json             # Project dependencies
└── README.md
```

---

## 📄 License
MIT License - Feel free to adapt, extend, and deploy!
