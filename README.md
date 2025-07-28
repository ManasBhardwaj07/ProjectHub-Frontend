# 🎨 ProjectHub – Frontend

🚀 **Live Demo:** [https://project-hub-frontend-mocha.vercel.app](https://project-hub-frontend-mocha.vercel.app)

This is the **frontend** for **ProjectHub**, a beautiful real-time project and task collaboration platform built with **React.js** and styled using **TailwindCSS** and **Framer Motion**.

---

## ✨ Features

- 🔐 Login, Register, Forget & Reset Password functionality
- 🔒 Token-based authentication with protected routes
- 🧱 Kanban board with drag-and-drop for task status
- 📝 Create, edit, delete, and filter projects
- ⚡ Real-time project & task sync via **Socket.IO**
- 🌗 Light/Dark mode toggle
- 📱 Fully responsive for all screen sizes

---

## 🧰 Tech Stack

- **React.js**
- **Vite**
- **Tailwind CSS**
- **Framer Motion**
- **Socket.IO Client**
- **Axios**

---

## 🌍 Environment Variables (`.env`)

For **local development**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000


```

## 🔧 Local Development

1. Clone the repo:
```bash
git clone https://github.com/ManasBhardwaj07/ProjectHub-Frontend.git
cd ProjectHub-Frontend
```

2. Create `.env` file using template above.

3. Install dependencies:
```bash
npm install
```

4. Start the dev server:
```bash
npm run dev
```

App will run on: `http://localhost:5173`

---

## 🚀 Deployment (Vercel)

- Push the repo to GitHub
- Import into [Vercel](https://vercel.com)
- Set `.env` variables in **Project Settings > Environment Variables**
- Add a `vercel.json` file for React Router:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## 📄 License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
