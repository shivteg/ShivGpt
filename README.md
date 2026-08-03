# ⚡ ShivGpt (SAI) - Next.js AI & Image Generation Web App

A high-performance, ChatGPT-style web interface powered by **ShivGpt (SAI)** with Meta/DeepSeek open models (**Llama 3.3 70B**, **Llama 3.1 8B**, **DeepSeek R1 Distill**) and **AI Image Generation** (**FLUX.1 Schnell**, **DALL-E 3**, **Stable Diffusion XL**, **Pollinations AI**). Built with Next.js 14, TypeScript, Tailwind CSS, and Lucide Icons. Ready for 1-click deployment on **Vercel**.

---

## 🌟 Key Features

- ⚡ **Ultra-Fast SAI Inference**: Real-time text responses up to 800+ tokens/sec.
- 🎨 **AI Image Generation Studio**: Generate high-definition AI artwork directly from prompts or using `/image [prompt]` command.
- 🤖 **Multi-Model Selector**: Switch between Meta Llama 3.3 70B, DeepSeek R1, FLUX.1 Schnell, DALL-E 3, and SDXL.
- 🖼️ **Image Studio Tools**: Fullscreen preview, one-click HD download, prompt history, and copy-link features.
- 🎨 **ChatGPT UI & Dark Mode**: Sleek glassmorphism theme, markdown support, syntax highlighting, and copy-code buttons.
- 📊 **Performance Analytics**: Live tokens/sec counter, completion tokens count, and API latency badges.
- ⚙️ **Customizable Settings**: Set custom API keys for text and image models, system prompts, temperature, max tokens.
- 💬 **Chat Management**: Create new chats, rename threads, clear history, with full `localStorage` persistence.
- 🌐 **Vercel Ready**: Edge serverless architecture configured for zero-setup Vercel deployment.

---

## 🔑 Environment Variables Setup

When you place your API keys in environment variables (`.env.local` for local development or **Vercel Project Settings -> Environment Variables**), ShivGpt will automatically pick them up!

### 1. Text Generation API Key
- **`GROQ_API_KEY`**: Get your key at [console.groq.com/keys](https://console.groq.com/keys)

### 2. Image Generation API Keys (Any of the following will work!):
- **`IMAGE_GEN_API_KEY`**: Universal image generation key
- **`TOGETHER_API_KEY`**: For FLUX.1 Schnell & Stable Diffusion XL ([together.ai](https://together.ai))
- **`OPENAI_API_KEY`**: For DALL-E 3 ([platform.openai.com](https://platform.openai.com))
- **`HF_TOKEN`**: For Hugging Face Inference API ([huggingface.co](https://huggingface.co))
- **`STABILITY_API_KEY`**: For Stability AI ([stability.ai](https://stability.ai))

*(If no key is configured, ShivGpt uses high-speed Pollinations FLUX as a free default fallback so image generation always works!)*

---

## 🚀 How to Deploy on Vercel

1. Push this repository to your **GitHub / GitLab / Bitbucket** account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. Under **Environment Variables**, add:
   - `GROQ_API_KEY` = `gsk_your_groq_api_key_here`
   - `IMAGE_GEN_API_KEY` = `your_image_api_key_here`
4. Click **Deploy**! 🎉

---

## 💻 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/shivteg/ShivGpt.git
cd ShivGpt

# 2. Install dependencies
npm install

# 3. Create .env.local file and set your API keys
echo "GROQ_API_KEY=gsk_your_groq_api_key_here" >> .env.local
echo "IMAGE_GEN_API_KEY=your_image_api_key_here" >> .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
MIT License - Feel free to adapt, extend, and deploy!
