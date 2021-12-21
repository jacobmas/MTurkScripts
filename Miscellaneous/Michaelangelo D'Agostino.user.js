// ==UserScript==
// @name         Michaelangelo D'Agostino
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A17DJ2W8T2VIYD",true);
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
          //  if(parsed_context.Instagram && type==="query" && parsed_context.Title!="Instagram") { resolve({url:parsed_context.Instagram}); return; }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && i<1 &&
                   /instagram\.com/.test(b_url) && !/\/(p|tv|explore)\//.test(b_url) &&
                   (my_query.try_count[type]===0 || !MTurkScript.prototype.is_bad_name(b_name.replace(/\s•.*$/,""),my_query.name,p_caption,i) || new RegExp(my_query.name).test(p_caption))
		   && (b1_success=true)) break;
                else if(type==="cameo" && (!MTurkScript.prototype.is_bad_name(b_name.replace(/Cameo -\s*/,"").trim(),my_query.name,p_caption,i))
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,caption:p_caption,type:type})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(my_query.name+" "+my_query.bio+" site:instagram.com", resolve, reject, query_response,"query");
            return;
        }
        if(type==="query" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
             query_search(my_query.name+" "+my_query.cameo+" site:instagram.com", resolve, reject, query_response,"query");
            return;
        }
        else if(type==="query" && my_query.try_count[type]===2) {

            let url="https://www.instagram.com/"+my_query.cameo;
            my_query.fields.instagram_profile_link=url;

            my_query.fields.instagram_user_name=my_query.cameo;
            try {
                var promise=MTP.create_promise(url,AggParser.parse_instagram,parse_instagram_then,function(error) { console.log("error=",error); GM_setValue("returnHit",true); });
            }
            catch(e) {
                GM_setValue("returnHit",true); }
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

    AggParser.parse_instagram=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,j,parsed,script_regex=/^window\._sharedData\s*\=\s*/;
    var result={success:false};
    for(i=0; i < scripts.length; i++) {
        if(script_regex.test(scripts[i].innerHTML))  {
            parsed=JSON.parse(scripts[i].innerHTML.replace(script_regex,"").replace(/;$/,""));
	    try {
		result=AggParser.parse_insta_script(parsed);
	    }
	    catch(error) { console.log("Error in parse_insta_script"+error); }
            resolve(result);
            break;
        }
    }
        var description=doc.querySelector("meta[name='description']");
       // console.log("description.content=",description.content);
        try {
            var match=description.content.match(/([\d,]+)\sPosts/);
            if(match) result.posts=match[1];
        }
        catch(e) {
            reject("");
            return;
        }




    resolve(result);
    return;
};

    function cameo_promise_then(result) {
        my_query.cameo_url=result.url;
        my_query.cameo=my_query.cameo_url.replace("https://www.cameo.com/","").replace(/\?.*$/,"");
        console.log("* cameo=",my_query.cameo);
         var search_str="\""+my_query.name+"\" "+my_query.bio+" instagram";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.instagram_profile_link=result.url;

        my_query.fields.instagram_user_name=result.url.replace(/https?:\/\/(www\.)?instagram\.com\//,"").replace(/\/.*$/,"");
        var followers_re=/([0-9][^\s]*) Followers/, posts_re=/([0-9][^\s]*) Posts/,match1,match2;
       if(result.caption && (match1=result.caption.match(followers_re)) && (match2=result.caption.match(posts_re))) {
            my_query.fields.instagram_followers=match1[1].replace(/,/g,"").trim();
            my_query.fields.instagram_posts=match2[1].replace(/,/g,"").trim();
            if(/K|M/i.test(my_query.fields.instagram_followers) || parseInt(my_query.fields.instagram_followers)>4500)         submit_if_done();
            else GM_setValue("returnHit",true);
            return;
        }
        add_to_sheet();
        if(result.type==="query") {
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(result.url, resolve, reject, query_response,"insta");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }
      /*  try {

            var promise=MTP.create_promise(result.url,AggParser.parse_instagram,parse_instagram_then,function(error) { console.log("error=",error); GM_setValue("returnHit",true); });
        }
        catch(e) { GM_setValue("returnHit",true); }*/
    }

    function cleanup_number(to_clean) {
        to_clean=to_clean.toString().replace(/,/g,"");
        var ret=to_clean;
        let int_val=parseInt(to_clean);
        if(int_val>=10000 && int_val<100000) {
            console.log(int_val/100);
            int_val=Math.floor(int_val/100);
            int_val=int_val*0.1;
            ret=int_val.toString().replace(/(\.\d).*$/,"$1")+"k";
        }
        else if(int_val>=100000 && int_val<1000000) {
            console.log(int_val/1000);
            int_val=Math.floor(int_val/1000);
            //int_val=int_val*0.1;
            ret=int_val.toString().replace(/(\.\d).*$/,"$1")+"k";
        }
        else if(int_val>=1000000&&int_val<100000000) {
            int_val=Math.floor(int_val/100000);
            int_val=int_val*0.1;
            ret=int_val.toString().replace(/(\.\d).*$/,"$1")+"m";
            return ret;
        }
        else if(int_val>=100000000) {
            int_val=Math.floor(int_val/1000000);
            //int_val=int_val*0.1;
            ret=int_val.toString().replace(/(\.\d).*$/,"$1")+"m";
        }
        return ret;

    }

    function parse_instagram_then(result) {
        console.log("result=",result);
        my_query.fields.instagram_followers=cleanup_number(result.followers);
        my_query.fields.instagram_posts=cleanup_number(result.posts);
        if(result.followers>5000)         submit_if_done();
        else {
            console.log("Too few followers, returning");
            GM_setValue("returnHit",true);
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
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var span=document.querySelectorAll("crowd-form span")[1];
       span.parentNode.removeChild(span);
        var li=document.querySelectorAll("crowd-form form div div div li");
        
        my_query={parsed_name:{},name:li[0].innerText.replace(/^[^:]*:\s*/,"").trim(),
                  bio:li[1].innerText.replace(/^[^:]*:\s*/,"").replace(/^(.{30,}?)[!\.]\s.*$/,"$1").trim(),
                  fields:{},done:{},
		  try_count:{"query":0,"insta":0},
		  submitted:false};

        my_query.bio=my_query.bio.replace(/(?:^|.*\s)(Tennis|MLB|NHL|NFL|NBA|Volleyball)(?:\s.*|$)/i,"$1");
	console.log("my_query="+JSON.stringify(my_query));
        console.log("my_query.parsed_name=",!!my_query.parsed_name);
        my_query.people=nlp(my_query.name).people().json();
        if(my_query.people&&my_query.people.length>0) my_query.parsed_name=MTP.parse_name(my_query.name);
        console.log("people=",my_query.people,", name=",my_query.parsed_name);
         var search_str=my_query.name+" "+my_query.bio+" site:cameo.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"cameo");
        });
        queryPromise.then(cameo_promise_then)
            .catch(function(val) {
            console.log("Failed at this cameoPromise " + val); cameo_promise_then({url:""}); });
    
    }

})();