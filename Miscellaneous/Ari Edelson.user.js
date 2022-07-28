// ==UserScript==
// @name         Ari Edelson
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3LDX8N72BX1VI",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function parse_b_ans(b_ans) {
        /* Parses for answer in b_ans */
        console.log("b_ans=",b_ans);
        let ret="";
        let answer=b_ans.querySelector(".b_focusTextLarge,.b_focusTextMedium");
        if(answer) {
            ret=answer.innerText.trim();
        }
        return ret;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, b_ans, parsed_b_ans;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_ans=doc.querySelector(".b_ans.b_top");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                    resolve(parsed_lgb.url);
                    return;
                }

            }
            if(b_ans && (parsed_b_ans = parse_b_ans(b_ans))) {
                my_query.fields.name=parsed_b_ans;
            }

            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
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
        my_query.url=result;
                var query={dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/,/Director/]};

        var promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function() { GM_setValue("returnHit",true); },query);
    }

    function owner_promise_then(result) {
        if(result) {
            my_query.fields.name=result;

        }
        my_query.done.owner=true;
        submit_if_done();
    }

    function get_quality(curr) {
        var ret=0;
        if(curr.name) ret+=1;

        console.log("nlp="+nlp(curr.name).people().json().length);
        if(nlp(curr.name).people().json().length>0) ret+=2;
        if(curr.name.length>=1 && curr.name.substr(0,1).toUpperCase()===curr.name.substr(0,1)) ret+=5;
        if(curr.title) ret+=1;
        if(curr.title && /Manager|Director|^Partner$/.test(curr.title)) ret+=3;
        if(curr.title && /Marketing/.test(curr.title)) ret+=6;
        if(curr.title && /^General Manager$/i.test(curr.title)) ret+=8;

        if(curr.title && /Owner|CEO|President/.test(curr.title)) ret+=15;
        if(curr.email) ret+=3;
        if(curr.phone) ret+=1;
        if(!curr.name||(curr.name&&/Funeral|((^| )(Home|Our)( |$))/i.test(curr.name))||(/\s+Box/.test(curr.title))) ret=0;
        if(nlp(curr.name).people().json().length===0) ret-=10;

        if(/^LLC( |$)/.test(curr.title)) ret=0;
        if(/\s(Rd\.|Dr\.|St\.)/.test(curr.name)) ret=0;
        return ret;
    }

    function comparequal(a,b) { return b.quality-a.quality; }

    function gov_promise_then(result) {
        console.log("Gov.email_list=",Gov.email_list);
        my_query.done.query=true;
        var new_contact_list=Gov.contact_list.map(item => { item.quality=get_quality(item); return item; });
        new_contact_list.sort(comparequal);
                    console.log("Gov.contact_list=",new_contact_list);

        if(new_contact_list.length>0 && new_contact_list[0].email) {
            my_query.fields.name=new_contact_list[0].name;
            my_query.fields.email=new_contact_list[0].email;
            submit_if_done();
        }
        else {
            if(Gov.email_list.length>0) {
                my_query.fields.email=Gov.email_list[0].email;
                add_to_sheet();
            }
            //GM_setValue("returnHit",true);
        }
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
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
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        
        my_query={name:MTP.shorten_company_name(wT.rows[0].cells[1].innerText.trim()),city:wT.rows[2].cells[1].innerText.trim(),
                  state: wT.rows[3].cells[1].innerText.trim(),fields:{name:"",email:""},done:{query:false,owner:false},
		  try_count:{"query":0,"owner":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        const ownerPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(MTP.shorten_company_name(my_query.name)+" "+my_query.state+" owner", resolve, reject, query_response,"owner");
        });
        ownerPromise.then(owner_promise_then)
            .catch(function(val) {
            console.log("Failed at this ownerPromise " + val); my_query.done.owner=true; submit_if_done(); });
    }

})();