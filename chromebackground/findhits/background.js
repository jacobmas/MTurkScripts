let color = '#3aa757';

var hits_to_get=10;
var notified=false;

var good_non_auto=["Brian Hession","mlamba","ChrisRichmond","Researcher2022","Igor"];

var good_requesters=["A1BOHRKGTWLMTJ"]; // For now just DoctorDB

/* Dictionary of good hits non-autograbbed */
var recent_good_hits={}; 

// for doctordb?  //https://worker.mturk.com/projects/3MQQ4RVXBBHPUKA68EQ27OEKCA12A7/tasks/accept_random?ref=w_pl_prvw
// https://worker.mturk.com/requesters/A1BOHRKGTWLMTJ/projects

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

chrome.alarms.create("checkForHits",{when:Date.now(),periodInMinutes:1});

chrome.alarms.onAlarm.addListener(function(alarm) {
	console.log("MOO");
	let req;
	if(hits_to_get<1) hits_to_get++;
	if(alarm.name==="checkForHits") {
		console.log("checking for hits");
		let iter;
		for(iter of good_non_auto) {
			console.log(`storage ${iter}=${chrome.storage.local.get(iter, function(result) { 
				console.log("result=",result) 
			})}`)
		}
	}
	else { return; }
	/* Iterate over requesters, look for hits */
	for(req of good_requesters) {
		let curr_url=`https://worker.mturk.com/requesters/${req}/projects`;
		console.log(`curr_url=${curr_url}`);
		response=fetch(curr_url).then(
		function(response) {
			response.text().then(function(data) {
			let result=parse_text2(data);
		  });
		
	});
	}
	
	
	/* Check main page */
	response=fetch('https://worker.mturk.com/').then(
	function(response) {
		response.text().then(function(data) {
        let result=parse_text(data);
      });
		
	});
	
	
	setTimeout(function() { 
		for(req of good_requesters) {
			let curr_url=`https://worker.mturk.com/requesters/${req}/projects`;
			console.log(`curr_url=${curr_url}`);
			response=fetch(curr_url).then(
			function(response) {
				response.text().then(function(data) {
				let result=parse_text2(data);
			  });
			
		});
		}
		response=fetch('https://worker.mturk.com/').then(
	function(response) {
		response.text().then(function(data) {
        let result=parse_text(data);
      });
		
	});
	}, 15000);
	
	setTimeout(function() { 
		for(req of good_requesters) {
			let curr_url=`https://worker.mturk.com/requesters/${req}/projects`;
			console.log(`curr_url=${curr_url}`);
			response=fetch(curr_url).then(
			function(response) {
				response.text().then(function(data) {
				let result=parse_text2(data);
			  });
			
		});
		}
		response=fetch('https://worker.mturk.com/').then(
	function(response) {
		response.text().then(function(data) {
        let result=parse_text(data);
      });
		
	});
	}, 30000);
	setTimeout(function() { 
		for(req of good_requesters) {
			let curr_url=`https://worker.mturk.com/requesters/${req}/projects`;
			console.log(`curr_url=${curr_url}`);
			response=fetch(curr_url).then(
			function(response) {
				response.text().then(function(data) {
				let result=parse_text2(data);
			  });
			
		});
		}
		response=fetch('https://worker.mturk.com/').then(
	function(response) {
		response.text().then(function(data) {
        let result=parse_text(data);
      });
		
	});
	}, 45000);
	//fetch('https://worker.mturk.com/tasks').then(function(data) {});
});

function parse_text2(data) {
	let got_hits=false;
	notified=false;
	console.log("parse_text2, hits_to_get=",hits_to_get," time=",Date.now());
	//hit_set_id&quot;:&quot;3O6LJLEA10KK4AUD417PIESQFEMJV7&quot;,&quot;requester_id&quot;:&quot;A6F2IPUML66ZK&quot;,&quot;requester_name&quot;:&quot;tafka-rnd&quot;,&quot;title&quot;:&quot;
	let my_re=new RegExp("hit_set_id\\&quot;:\\&quot;[^&]*\\&quot;,\\&quot;"+
		"requester_id\\&quot;:\\&quot;[^&]*\\&quot;,\\&quot;"+
		"requester_name\\&quot;:\\&quot;[^&]*\\&quot","g");
//	let my_re=/requester_name\&quot\;\:\&quot\;[^&]*\&quot/g;
	let my_re_name=/requester_name\&quot\;\:\&quot\;([^&]*)\&quot/;
	let my_re_setid=/hit_set_id\&quot\;\:\&quot\;([^&]*)\&quot/;

	let my_match=data.match(my_re);
	
	//my_match=my_match.map(x => x.replace(my_re_name,"$1"));
	var good_re=/Doctor DB/;
	console.log("parse_text2, my_match=",my_match);
	var x;
	var counter=0;
	if(!my_match) return "";
	for(x of my_match) {
		counter+=1;
		if(counter>50) break;
		var my_name_match=x.match(my_re_name);
		
		let my_id_match=x.match(my_re_setid);
		if(my_name_match && my_id_match) {
			console.log("parse_text2, my_name_match=",my_name_match[1]," my_id_match=",my_id_match[1]);
		}
		if(my_name_match && my_name_match.length>=2 && good_re.test(my_name_match[1])) {
			
			
			console.log("parse_text2, Bloop");
		//		get_hits(my_id_match[1],hits_to_get>=5?5:hits_to_get, my_name_match[1]);
				//hits_to_get=0;
			
			
		}
	}
	/*if(!got_hits&&hits_to_get<10) {
		hits_to_get++;
	}*/
		
	//console.log("data=",data);
	return "";
}


function parse_text(data) {
	let got_hits=false;
	notified=false;
	console.log("hits_to_get=",hits_to_get," time=",Date.now());
	//hit_set_id&quot;:&quot;3O6LJLEA10KK4AUD417PIESQFEMJV7&quot;,&quot;requester_id&quot;:&quot;A6F2IPUML66ZK&quot;,&quot;requester_name&quot;:&quot;tafka-rnd&quot;,&quot;title&quot;:&quot;
	let my_re=new RegExp("hit_set_id\\&quot;:\\&quot;[^&]*\\&quot;,\\&quot;"+
		"requester_id\\&quot;:\\&quot;[^&]*\\&quot;,\\&quot;"+
		"requester_name\\&quot;:\\&quot;[^&]*\\&quot","g");
//	let my_re=/requester_name\&quot\;\:\&quot\;[^&]*\&quot/g;
	let my_re_name=/requester_name\&quot\;\:\&quot\;([^&]*)\&quot/;
	let my_re_setid=/hit_set_id\&quot\;\:\&quot\;([^&]*)\&quot/;

	let my_match=data.match(my_re);
	
	//my_match=my_match.map(x => x.replace(my_re_name,"$1"));
	var good_re=/Doctor DB/;
	var good_non_auto_re=/Brian Hession|mlamba|ChrisRichmond/;
	console.log("my_match=",my_match);
	var x;
	var counter=0;
	var begin_time=Date.now();
	if(!my_match) return "";
	for(x of my_match) {
		counter+=1;
		if(counter>50) break;
		var my_name_match=x.match(my_re_name);
		
		let my_id_match=x.match(my_re_setid);
		if(my_name_match && my_id_match) {
			console.log("my_name_match=",my_name_match[1]," my_id_match=",my_id_match[1]);
		}
		if(my_name_match && my_name_match.length>=2 && good_re.test(my_name_match[1])) {
			
			if(/Doctor DB/.test(my_name_match[1])) {
				got_hits=true;
				console.log("Bloop");
				get_hits(my_id_match[1],hits_to_get>=5?5:hits_to_get, my_name_match[1], false);
				//hits_to_get=0;
			}
			
		}
		else if(my_name_match && my_name_match.length>=2 && 
		good_non_auto.includes(my_name_match[1])
		)
		
		{
			get_notify_chrome_storage(my_name_match[1]);



		}
	}
	if(!got_hits&&hits_to_get<10) {
		hits_to_get++;
	}
		
	//console.log("data=",data);
	return "";
}

function hit_accept(response,my_id_match,count,name_match, output_good) {
//	console.log("hit_accept,response=",response);
	var no_more_re=/There are no more of these HITs available/;
	if(!no_more_re.test(response)) {
		console.log("Found good, ",name_match);
		hits_to_get-=2;
		if(hits_to_get<0) hits_to_get=0;
		if(!output_good) {
			chrome.notifications.create('test', {
			type: 'basic',
			iconUrl:'images/get_started16.png',
			title: 'HIT Alert',
			message: `Hits from ${name_match} available`,
			priority: 2
			});
		}
		if(count>0) {
			setTimeout(function() { get_hits(my_id_match, count, name_match, true) }, 400);
		}
	}
	else {
		//console.log("response=",response);
		console.log(`No more hits available ${my_id_match}`);
		if(!output_good && hits_to_get<10) {
			hits_to_get++;
			console.log("Adding a hit");
		}
	}
/*<div data-react-class="require(&#39;reactComponents/alert/Alert&#39;)[&#39;PureAlert&#39;]" data-react-props="{&quot;type&quot;:&quot;danger&quot;,&quot;header&quot;:&quot;There are no more of these HITs available&quot;,&quot;message&quot;:&quot;Browse &lt;a href=\&quot;/projects\&quot;&gt;all available HITs&lt;/a&gt;.&quot;,&quot;renderMessageAsHTML&quot;:true}"></div>*/
}

function get_notify_chrome_storage(name) {
	console.warn("name=",name)
	chrome.storage.sync.get([name]).then(function(result) { handle_name(name,result) });
	
	/*, function(result) {
		console.warn("get response, result=",result,"name=",name)

		let begin_time = Date.now();
		if(result.key) {
			console.log("result.key=",result.key,"name=",name,
			"begin_time-result.key=",begin_time-result.key);
		}
		if(!result.key || begin_time-result.key>=1000*43200) {
			// Alert twice a day about new hit sets? 
			chrome.notifications.create('nongrabbed', {
				type: 'basic',
				iconUrl:'images/get_started16.png',
				title: 'HIT Alert',
				message: `Hits from ${name} available ${begin_time-result.key}`,
				priority: 2
				});
			let key=name;
			chrome.storage.local.set({key:begin_time.toString()},function(response) {
				console.warn("set response, response=",response,"name=",name);
				chrome.storage.local.get(key,function(result) { 
					console.log("inner getresult=",result);
				});

			});
		}
	});*/
}

function handle_name(name, result) {
	console.warn("handle_name, result=",JSON.stringify(result));
	let begin_time = Date.now();
		if(result[name]) {
			console.log(
			"begin_time-result["+name+"]=",begin_time-result[name]);
		}
		if(!result[name] || begin_time-result[name]>=1000*43200) {
			// Alert twice a day about new hit sets? 
			chrome.notifications.create('nongrabbed', {
				type: 'basic',
				iconUrl:'images/get_started16.png',
				title: 'HIT Alert',
				message: `Hits from ${name} available ${begin_time-result[name]}`,
				priority: 2
				});
			let key=name;
			var jsonfile = {};
    	jsonfile[key] = begin_time;
			chrome.storage.sync.set(jsonfile,function(response) {
				

			});
		}

}


function get_hits(my_id_match, count,name_match,  output_good) {
	count=count-1;
	let temp_url=`https://worker.mturk.com/projects/${my_id_match}/tasks/accept_random?ref=w_pl_prvw`;
	console.log("get_hits, my_id_match=",my_id_match," count=",count," url=",temp_url);
	fetch(temp_url).then(function(response) { response.text().then(
		(response) => { hit_accept(response,my_id_match,count,  name_match, output_good); 
			});
	});
	
	

}