document.addEventListener('DOMContentLoaded', () => {
  if (window.hljs) {
    hljs.highlightAll()
  }

  const createBtn = document.querySelector('.create-btn')
  const langSelect = document.getElementById('paste-language')
  const copyLinkBtn = document.querySelector('.copy-btn')
  const copyCodeBtn = document.getElementById('copy-code-btn')

  if (createBtn) {
    createBtn.addEventListener('click', createPaste)
  }

  if (langSelect) {
    langSelect.addEventListener('change', updateLangBadge)
  }
  if (copyLinkBtn) {
  copyLinkBtn.addEventListener('click', copyLink)
  }
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', copyCode)
  }


})

async function createPaste() {
  const title = document.getElementById('paste-title').value
  const content = document.getElementById('paste-content').value
  const language = document.getElementById('paste-language').value
  const expiry = document.getElementById('paste-expiry').value

  if (!content.trim()) {
    alert('Content is required')
    return
  }

  try {
    const res = await fetch('/api/pastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, language, expiry }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Something went wrong')
      return
    }

    const box = document.getElementById('success-box')
    const link = document.getElementById('paste-link')
    const url = `${window.location.origin}/paste/${data.shortId}`

    link.href = url
    link.textContent = url
    box.classList.remove('hidden')
    box.scrollIntoView({ behavior: 'smooth' })
  } catch (err) {
    alert('Failed to create paste')
  }
}

function copyLink() {
  const url = document.getElementById('paste-link').textContent
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('.copy-btn')
      btn.textContent = 'Copied!'
      setTimeout(() => btn.textContent = 'Copy link', 2000)
    })
  } else {
    // fallback for HTTP
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    const btn = document.querySelector('.copy-btn')
    btn.textContent = 'Copied!'
    setTimeout(() => btn.textContent = 'Copy link', 2000)
  }
}

function copyCode() {
  const code = document.getElementById('paste-code')
  if (!code) return

  const text = code.textContent

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copy-code-btn')
      btn.textContent = 'Copied!'
      setTimeout(() => btn.textContent = 'Copy', 1500)
    })
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    const btn = document.getElementById('copy-code-btn')
    btn.textContent = 'Copied!'
    setTimeout(() => btn.textContent = 'Copy', 1500)
  }
}

function updateLangBadge() {
  const lang = document.getElementById('paste-language').value
  document.getElementById('lang-badge').textContent = lang
}