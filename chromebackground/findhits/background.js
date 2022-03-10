let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

chrome.alarms.create("checkForHits",{when:Date.now(),periodInMinutes:1});

chrome.alarms.onAlarm.addListener(function(alarm) {
	console.log("MOO");
	if(alarm.name==="checkForHits") {
		console.log("checking for hits");
		
	}
	
	response=fetch('https://worker.mturk.com/').then(
	function(response) {
		response.text().then(function(data) {
        let result=parse_text(data);
      });
		
	});
});


function parse_text(data) {
	var doc = new DOMParser()
        .parseFromString(data, "text/html");
	console.log("doc=",doc);
	return "";
}