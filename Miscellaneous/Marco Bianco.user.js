// ==UserScript==
// @name         Marco Bianco
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  get address and phone for places?
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[".citydirectory.us",".weebly.com",".edu/",".k12.",".georgia.gov"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(45000,750+(Math.random()*1000),[],begin_script,"A2ZTU8VFYUPZWP",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
             if(parsed_context.SubTitle&&/Census/.test(parsed_context.SubTitle)) {
                console.log("Found");
                 if(my_query.fields.url_web) delete my_query.fields.url_web;
                my_query.fields.rp_comments="Not an incorporated place";
                submit_if_done();
                return;
            }
            if(parsed_context.Phone) {
                my_query.fields.phone_general=parsed_context.Phone; }
			if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)&&(my_query.url||/^(City|Town|Village)/.test(parsed_context.Title))) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
				/*	if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }*/
					
					}
            for(i=0; i < b_algo.length&&i<1; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("a[href^='http'").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="wikipedia" && /\(CDP\)|census-designated place/.test(p_caption)) {
                    if(my_query.fields.url_web) delete my_query.fields.url_web;

                    my_query.fields.rp_comments="Not an incorporated place";
                    if(my_query.fields.phone_general) delete my_query.fields.phone_general;
                    submit_if_done();
                    return;
                }
                if(type==="wikipedia" && !MTurkScript.prototype.is_bad_name(b_name.replace(/\s-\s.*$/,""),my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                let temp_phone;
                if(!my_query.url&&!/\.edu(\/|$)/.test(b_url) && !MTP.is_bad_url(b_url,bad_urls,3,2) && (new RegExp(my_query.loc,"i").test(b_name)||new RegExp("(city|village|town) of "+my_query.loc,"i").test(p_caption))
                   &&
                   (new RegExp(my_query.state).test(b_name) || new RegExp(my_query.state).test(p_caption) ||

                    new RegExp(state_map[my_query.state]).test(b_name) ||new RegExp(state_map[my_query.state]).test(p_caption) || new RegExp(my_query.loc.replace(/\s/g,"")+state_map[my_query.state],"i").test(b_url)) &&
                   !/Country Club|Dental|church|School District|Schools|Restaurant|Weddings|Events|Apartments|Chamber of| Elementary/i.test(b_name) &&
                   (b1_success=true)) {
                    break;

                }
                if(MTP.get_domain_only(b_url,true)===MTP.get_domain_only(my_query.url,true) && (temp_phone=p_caption.match(phone_re))) {
                    my_query.fields.phone_general=temp_phone[0];
                    b1_success=true;
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        console.log("hello")
        if(type==="query" &&  my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let search_str=my_query.name+" address";
            if(!my_query.url) search_str=my_query.name+" website";
        console.log("hello")

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        else if(type==="query" && my_query.url && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            let search_str=my_query.name+" city phone";
        console.log("hello")

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        else if(type==="query" && (!my_query.url||my_query.try_count[type]===2)) {
            my_query.try_count[type]++;
            let search_str=my_query.name+" site:wikipedia.org";
        console.log("hello")

            query_search(search_str, resolve, reject, query_response,"wikipedia");
            return;
        }
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        if(/en\.wikipedia\.org/.test(result)) {
            var promise=MTP.create_promise(result,parse_wikipedia,parse_wikipedia_then,function() { GM_setValue("returnHit",true); });
        }
        else {
            if(MTP.get_domain_only(result,true)!=MTP.get_domain_only(my_query.url,true)&&my_query.url) { GM_setValue("returnHit",true); return; }
            else if(!my_query.url&&result) {
                console.log("result=",result);
                my_query.fields.url_web=my_query.url=result.replace(/(https?:\/\/[^\/]*).*$/,"$1").trim();
               //  console.log(my_query.fields.url_web);
            }
            const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" site:wikipedia.org", resolve, reject, query_response,"wikipedia");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
           
        }
    }

    function parse_wikipedia(doc,url,resolve,reject) {
        var temp_url=doc.querySelector(".infobox-data .url a");
        if(!temp_url) {
            let table=doc.querySelector("table.infobox");
            let row,cell,label,value;
            for(row of table.rows) {
                label=row.querySelector(".infobox-label");
                if(label && /Website/.test(label.innerText)) {
                    temp_url=row.querySelector(".infobox-data a");
                    break;
                }
               // console.log("row=",row);
            }
        }
        if(!temp_url) { if(my_query.url) { resolve(""); } else reject(""); return; }
        console.log("temp_url=",temp_url.href," my_query.url=",my_query.url);
        if(!my_query.no_initial_url && MTP.get_domain_only(temp_url.href,true)!=MTP.get_domain_only(my_query.url,true)&&my_query.url) { GM_setValue("returnHit",true); return; }
            else if(!my_query.url) {
                my_query.fields.url_web=my_query.url=temp_url.href.replace(/(https?:\/\/[^\/]*).*$/,"$1").trim();
                 console.log("wiki",my_query.fields.url_web);
            }

        resolve("");
    }
    function parse_wikipedia_then() {
        console.log("parse_wikipedia_then, parsing website,");
        if(document.querySelector("#url_web")) document.querySelector("#url_web").click();
        console.log("my_query.fields=",my_query.fields," url=",my_query.url);
        if(my_query.fields.phone_general) submit_if_done();
        else {
         console.log("MOO");
            var promise=MTP.create_promise(my_query.url,parse_website,submit_if_done,function() { GM_setValue("returnHit",true); });
        }
    }

    function parse_website(doc,url,resolve,reject,query,attempt) {
        var phone="";
        console.log("parse_website,url=",url,"attempt=",attempt);

        if(!phone) {
            let temp=doc.querySelector("a[href^='tel:']"),temp2;
            if(temp) {
                let temp2=temp.href.replace(/tel:/,"").replace(/[^\d]*/g,"").replace(/^1/,"");
                console.log("temp2=",temp2);
                if(temp2.length>=10)  phone=temp2.substr(0,3)+"-"+temp2.substring(3,6)+"-"+temp2.substring(6,10);
            }
        }
        if(!phone) phone=Gov.find_phone(doc,url);
        console.log("phone=",phone);
        
        if(!phone) {



            phone=doc.body.innerText.match(phone_re); if(phone) phone=phone[0].trim(); }
        if(phone) {
            my_query.fields.phone_general=phone.replace(/[A-Za-z:\s]*/,"").trim();
            resolve("");
            return;
        }
        else {
            var contact;
            var a;
            if(my_query.contacts) { reject(); return; }
            for(a of doc.links) {
                if(/Contact/i.test(a.innerText)||/contact/i.test(a.href)) {
                    my_query.contacts=true;
                    var promise=MTP.create_promise(MTP.fix_remote_url(a.href,url),parse_website,submit_if_done,function() { GM_setValue("returnHit",true); },1);
                    return;
                }
            }
            reject("");
        }
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&MTurk.assignment_id!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        console.log("submit_if_done,my_query.fields=",my_query.fields);
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var mark=document.querySelector("mark").innerText.trim();
        var split=mark.split(/\s*,\s*/);
        var loc=split[0];
        var state=reverse_state_map[split[1].trim()];
       var url=document.querySelector("form mark a");
        my_query={name:loc+", "+state,url:url?url.href:"",loc:loc,state:state,fields:{},done:{},
		  try_count:{"query":0,"wikipedia":0},
		  submitted:false};
        if(!url) my_query.no_initial_url=true;
        if(url) my_query.fields.url_web="";
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+(my_query.url?" city address":" official website");
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();