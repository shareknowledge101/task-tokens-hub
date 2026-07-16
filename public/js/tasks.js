const username = "testuser";

function triggerVideoAd() {
    const adBox = document.getElementById('ad-wrapper');
    const launchBtn = document.getElementById('launch-ad-btn');
    const adInjectTarget = document.getElementById('ad-inject-target');
    
    if (!adBox || !launchBtn || !adInjectTarget) return;

    // 1. Clear any previous ad elements so they don't pile up
    adInjectTarget.innerHTML = '';

    // 2. Disable the button and show loading state
    launchBtn.disabled = true;
    launchBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // 3. Show the ad wrapper so it has physical space in the layout
    adBox.classList.remove('hidden');

    // 4. Initialize backend validation session
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

        // 5. DYNAMIC SCRIPT INJECTION (Forces browser to evaluate and load the ad block)
        const adScript = document.createElement('script');
        adScript.type = 'text/javascript';
        adScript.src = 'https://pl30335909.effectivecpmnetwork.com/08/6e/aa/086eaa61a28eb4deb7c779d111239e85.js';
        adScript.async = true;
        
        // Handle error gracefully if adblocker blocks the script
        adScript.onerror = () => {
            console.error("Ad block failed to load. Likely blocked by an extension.");
            adInjectTarget.innerHTML = `<p class="text-red-500 font-bold self-center">Disable your AdBlocker to view this ad and earn rewards.</p>`;
        };

        adInjectTarget.appendChild(adScript);

        // 6. Countdown Timer
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
    })
    .catch(err => {
        console.error("Error starting session:", err);
        launchBtn.disabled = false;
        launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        launchBtn.innerText = "Launch Ad";
    });
}