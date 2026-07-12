const username = "testuser";

function loadAIArticle() {
    const adBox = document.getElementById('ad-wrapper');
    const adTarget = document.getElementById('ad-inject-target');
    
    if(!adBox || !adTarget) return;

    adTarget.innerHTML = `<div class="text-yellow-400 font-bold p-6">🤖 AI Agent generating custom article stream...</div>`;
    adBox.classList.remove('hidden');

    fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            adTarget.innerHTML = data.article;
            alert(`🎉 AI Article Read! Credited. Your balance is now: ${data.newBalance} Tokens.`);
        }
    })
    .catch(err => {
        console.error(err);
        adTarget.innerHTML = `<div class="text-red-500 font-bold p-6">Failed to contact AI generator.</div>`;
    });
}

function triggerVideoAd() {
    const adBox = document.getElementById('ad-wrapper');
    if (adBox) adBox.classList.remove('hidden');
    
    setTimeout(() => {
        fetch('/api/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, amount: 50, taskName: "Video Ad View" })
        })
        .then(res => res.json())
        .then(data => {
            alert(`🎉 Success! Credited. Your balance is now: ${data.newBalance} Tokens.`);
        });
    }, 5000);
}