const username = "testuser";

function triggerVideoAd() {
    const adBox = document.getElementById('ad-wrapper');
    const launchBtn = document.getElementById('launch-ad-btn');
    const adInjectTarget = document.getElementById('ad-inject-target');
    
    if (!adBox || !launchBtn || !adInjectTarget) return;

    // 1. Clear any previous ad contents
    adInjectTarget.innerHTML = '';

    // 2. Disable the button and show loading state
    launchBtn.disabled = true;
    launchBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // 3. Show the ad wrapper
    adBox.classList.remove('hidden');

    // 4. Initialize backend validation session
    fetch('/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, taskName: "Video Ad" })
    })
    .then(res => res.json())
    .then(sessionData => {
        // Ensure the backend returned a successful session and dynamic token key
        if (!sessionData.success || !sessionData.sessionId) {
            launchBtn.disabled = false;
            launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            return alert("Session initialization failed.");
        }

        // Keep a secure reference to the sessionId
        const activeSessionId = sessionData.sessionId;

        // 5. Build dynamic Adsterra configurations so the script renders
        const adScriptConfig = document.createElement('script');
        adScriptConfig.type = 'text/javascript';
        adScriptConfig.innerHTML = `
            atOptions = {
                'key' : '086eaa61a28eb4deb7c779d111239e85',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
            };
        `;
        adInjectTarget.appendChild(adScriptConfig);

        // 6. Inject the main Adsterra script execution file
        const adScript = document.createElement('script');
        adScript.type = 'text/javascript';
        adScript.src = 'https://pl30335909.effectivecpmnetwork.com/08/6e/aa/086eaa61a28eb4deb7c779d111239e85.js';
        adScript.async = true;
        
        adScript.onerror = () => {
            console.error("Adblock detected or network failure.");
            adInjectTarget.innerHTML = `<p class="text-red-500 font-bold p-4">Please disable your AdBlocker to view ads and earn tokens.</p>`;
        };
        adInjectTarget.appendChild(adScript);

        // 7. Start the Countdown Timer
        let timeLeft = 5;
        launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;

        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;
            } else {
                clearInterval(countdown);
                launchBtn.innerText = "Claiming reward...";

                // 8. Secure reward claiming (Sending amount: 50 to satisfy the backend validation)
                fetch('/api/reward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: username, 
                        amount: 50, // This satisfies backend validation requirement
                        sessionId: activeSessionId 
                    })
                })
                .then(res => res.json())
                .then(data => {
                    launchBtn.disabled = false;
                    launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    launchBtn.innerText = "Launch Ad";
                    
                    if (data.error || !data.success) {
                        alert(data.error || "Failed to claim reward.");
                    } else {
                        alert(`🎉 Success! Credited. Your balance is now: ${data.newBalance} Tokens.`);
                    }
                })
                .catch(err => {
                    console.error("Error securing reward stream:", err);
                    launchBtn.disabled = false;
                    launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    launchBtn.innerText = "Launch Ad";
                });
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