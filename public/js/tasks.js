const username = "testuser";

function triggerVideoAd() {
    const adBox = document.getElementById('ad-wrapper');
    const launchBtn = document.getElementById('launch-ad-btn');
    if (!adBox || !launchBtn) return;

    // Disable the button and show loading state
    launchBtn.disabled = true;
    launchBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // Show the ad wrapper
    adBox.classList.remove('hidden');

    // Initialize backend validation session
    fetch('/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, taskName: "Video Ad" })
    })
    .then(res => res.json())
    .then(sessionData => {
        if (!sessionData.success) {
            launchBtn.disabled = false;
            launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            return alert("Session initialization failed.");
        }

        let timeLeft = 5;
        launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;

        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;
            } else {
                clearInterval(countdown);
                launchBtn.innerText = "Claiming reward...";

                // Claim reward using secure session id
                fetch('/api/reward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: username, 
                        amount: 50, 
                        sessionId: sessionData.sessionId 
                    })
                })
                .then(res => res.json())
                .then(data => {
                    launchBtn.disabled = false;
                    launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    launchBtn.innerText = "Launch Ad";
                    
                    if (data.error) {
                        alert(data.error);
                    } else {
                        alert(`🎉 Success! Credited. Your balance is now: ${data.newBalance} Tokens.`);
                    }
                })
                .catch(err => console.error("Error securing reward stream:", err));
            }
        }, 1000);
    });
}