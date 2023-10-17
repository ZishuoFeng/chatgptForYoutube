
document.addEventListener("DOMContentLoaded", function () {
    let chatboxHTML = `
        <div id="chatGPTExtensionChatbox" style="display: flex; flex-direction: column; position: fixed; bottom: 0; right: 0; z-index: 1000; background: #fff; border: 1px solid #ccc; border-radius: 10px 10px 0 0; padding: 10px; width: 300px; height: 500px; box-shadow: -2px -2px 5px rgba(0,0,0,0.1);">
            
            <!-- Chat Output -->
            <div id="chatGPTExtensionOutput" style="flex: 1; overflow-y: scroll; border-bottom: 1px solid #ccc; padding: 5px; margin-bottom: 8px;"></div>
            
            <!-- User Input -->
            <textarea id="chatGPTExtensionUserInput" placeholder="Type your question..." style="width: calc(100% - 20px); height: 50px; box-sizing: border-box; margin-bottom: 8px; border-radius: 5px; padding: 5px;"></textarea>
            
            <!-- Send Button and Loading Div -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <button id="chatGPTExtensionSendButton" style="flex: 1; margin-right: 10px; padding: 5px; border: none; background-color: #4CAF50; color: white; border-radius: 5px; cursor: pointer;">Send</button>
                <div id="chatGPTExtensionLoading" style="visibility: hidden; flex: 0; white-space: nowrap;">Loading...</div>
            </div>
        
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatboxHTML);

    document.getElementById('chatGPTExtensionSendButton').addEventListener('click', () => {
        let question = document.getElementById('chatGPTExtensionUserInput').value;
        document.getElementById('chatGPTExtensionUserInput').value = "";

        let outputDiv = document.getElementById('chatGPTExtensionOutput');
        outputDiv.innerHTML += `<p style="margin: 0; padding-bottom: 5px;"><strong>You:</strong> ${question}</p>`;
        outputDiv.scrollTop = outputDiv.scrollHeight;
        document.getElementById('chatGPTExtensionLoading').style.visibility = 'visible';

        fetch(`http://127.0.0.1:5000/access_gpt?question=${question}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('chatGPTExtensionLoading').style.visibility = 'hidden';
                    outputDiv.innerHTML += `<p style="margin: 0; padding-bottom: 5px; background-color: bisque"><strong>GPT:</strong> ${data.response}</p>`;
                    outputDiv.scrollTop = outputDiv.scrollHeight;
                })
                .catch(error => {
                    console.error('Error fetching video info from backend:', error);
                    document.getElementById('chatGPTExtensionLoading').style.display = 'hidden';
                });
    });


    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        let url = new URL(currentTab.url)
        let outputDiv = document.getElementById('chatGPTExtensionOutput');

        if (url.hostname === 'www.youtube.com' && url.pathname === '/watch') {
            const videoId = url.searchParams.get('v');
            if (videoId) {
                document.getElementById('chatGPTExtensionLoading').style.visibility = 'visible';
                fetch(`http://127.0.0.1:5000/get_video_info?videoId=${videoId}`)
                .then(response => response.json())
                .then(data => {
                    outputDiv.innerHTML += `<p style="margin: 0; padding-bottom: 5px; background-color: bisque"><strong>GPT:</strong> ${data.response}</p>`;
                    document.getElementById('chatGPTExtensionLoading').style.visibility = 'hidden';
                })
                .catch(error => {
                    console.error('Error fetching video info from backend:', error);
                    document.getElementById('chatGPTExtensionLoading').style.visibility = 'hidden';
                });
            }
        }
    });

});

