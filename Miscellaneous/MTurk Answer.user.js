// ==UserScript==
// @name         MTurk Answer
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
  var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A29OI0AQIEGQJJ",false);
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
            b_algo=search.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
           console.log("b_algo.length="+b_algo.length);
	 //   if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
             //   console.log("parsed_context="+JSON.stringify(parsed_context)); }
       //     if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
        //            console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
               b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!/wiki/.test(type) && /\/wiki\/Q/.test(b_url) && true//!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,type:type})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(my_query.try_count[type]===0) {

            my_query.try_count[type]+=1;
        query_search(my_query.answers[type]+" site:wikidata.org",resolve,reject,query_response,type);
            return;
        }

        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        //console.log("Searching with bing for "+search_str);
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
       // console.log("result=",result);
                var entityWiki=document.querySelectorAll("[id$='-wiki'].form-control");
    if(!entityWiki[parseInt(result.type)].value)    entityWiki[parseInt(result.type)].value=result['url'].replace(/\?.*$/,"");
        my_query.done[result.type]=true;
        submit_if_done();
    }

     function query_wiki_promise_then(result) {
       console.log("query_wiki_result=",result);

    }

    if(/mturkcontent\.com/.test(window.location.href))
    setTimeout(init_Query,1000);
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
    function entityChange(e) {
        e.preventDefault();
        console.log(e.target.onclick);
        console.log("e=",e);
        query_search(search_str, resolve, reject, query_response,"query");

    }

    function parse_wikidata(response, query, pos) {
        console.log("query=",query," pos=",pos);
        var json=JSON.parse(response.responseText);
                        var entityWiki=document.querySelectorAll("[id$='-wiki'].form-control");

        console.log("json=",json);
        let i;
        var min=-1;
        var lastTitle="";

        var good_pos=0;
        for(i=0;i<json.query.search.length&&i<2;i++) {
            let hit=json.query.search[i];
            var title= new DOMParser()
        .parseFromString(hit.titlesnippet, "text/html").body.innerText;
            var curr_val=parseInt(hit.title.substring(1));
            json.query.search[i].fullTitle=title;
            if(min<0) min=curr_val;
            console.log(`title:${title}, snippet:${hit['snippet']}, id: ${hit.title}`);
            console.log(parseInt(json.query.search[i].title.substring(1)));
//
            if((i===0||(i===1 &&curr_val<min))&&!/disambiguation|Wikimedia/.test(hit['snippet'])) {
                entityWiki[pos].value="https://www.wikidata.org/wiki/"+hit.title;
                min=curr_val;
                good_pos=i;
            }
            lastTitle=title;

        }
        if(json.query.search.length===0) {
            GM_setValue("returnHit",true);
            return;
        }
        console.log("query.toLowerCase()=",query.toLowerCase(),",  json.query.search[0].fullTitle.toLowerCase()=", json.query.search[0].fullTitle.toLowerCase());
        if(entityWiki[pos].value&&json.query.search.length>0 && (json.query.search.length<2 || json.query.search[0].fullTitle!=json.query.search[1].fullTitle)
          && MTP.matches_names(query.toLowerCase(),json.query.search[good_pos].fullTitle.toLowerCase())

          ) {
            submit_if_done();
            return;
        }
        else {
            console.log("Ambiguous, returning");
            GM_setValue("returnHit",true);
        }


    }

    function parse_wikidata_then() {
    }

    function do_wiki_call(url, search_item,i)
    {

         GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) { parse_wikidata(response, search_item, i); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function init_Query(split_ands)
    {
        console.log("in init_query");
        var i;
       var h3="";//document.querySelectorAll("crowd-form #raw")[1].innerText.replace(/^[^:]*:\s*/,"");
        /*console.log("h3=",h3);
      //  var well=document.querySelector("#well");
        //well.click();
        var tokens=document.querySelectorAll(".token");
        var search=document.querySelectorAll("[name='wikisearch']");
        var entitytag=document.querySelectorAll("[id$='-tag']");
        var entityhidden=document.querySelectorAll("[id$='-hidden']");*/
        var entity=document.querySelectorAll("[name='entity']");
        var entityWiki=document.querySelectorAll("[id$='-wiki'].form-control");

    /*   // console.log("entity=",entityWiki);

        //console.log("entityTag=",entitytag);*/
        var token_array=[];
        var tag_array=[];
        var answer_array=[];
       var pos=0;
        for(i=0;i<entity.length;i++) {

            tag_array.push("");
            token_array.push("");
            answer_array.push(entity[i].value.trim());
        }
      /*  let tag_string="";
        let hidden_string="";

        for(i=0;i<tokens.length;i++) {


            //console.log("tokens["+i+"]="+tokens[i].innerText);
            if(/^\s*and(\s|$)/.test(tokens[i].innerText) && i>0 && /,\s*$/.test(tokens[i-1].innerText)) continue;
            if(tokens[i].innerText.trim()!=="" && !(pos>3 && /^\s*and(\s|$)/.test(tokens[i].innerText))) {

            tag_string+=(tag_string.length>0?",":"")+`${i},${i+1}`;
            hidden_string+=(hidden_string.length>0?" ":"")+tokens[i].innerText.trim();
            }
            //console.log("tag_string=",tag_string," hidden_string=", hidden_string);
            if(/(,|\))\s*$/.test(tokens[i].innerText.trim()) ||(pos>3 && /^\s*and(\s|$)/.test(tokens[i].innerText)) || i===tokens.length-1) {
                tag_array[pos]=tag_string;
                answer_array[pos]=hidden_string;
                hidden_string=tag_string="";
                pos+=1;
                                if(pos>=12) break;

            }
        }
        //console.log("tag_array=",tag_array);
        //console.log("answer_array=",answer_array);

        var people=nlp(h3).topics().json();
        var places=nlp(h3).places().json();
                var org=nlp(h3).organizations().json();

        console.log("nouns=",nlp(h3).nouns().json());

        console.log("topics=",people," org=",org);&
        for(i=0;i<pos;i++) {
            entitytag[i].value=tag_array[i];
            entityhidden[i].value=answer_array[i];
            entity[i].value=answer_array[i];
        }

        var x;
        for(x of search) {
            x.addEventListener("click",entityChange);



        }*/



        my_query={question:h3, answers:answer_array,name,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        for(i=0;i< pos;i++) {
            my_query.done[i]=false;
        }
	console.log("my_query="+JSON.stringify(my_query));

        for(i=0;i<answer_array.length;i++) {
            console.log("i=",i);
            my_query.try_count[i]=0;
            var nlp_nouns=nlp(answer_array[i]).nouns();
            var nlp_singular=nlp_nouns.toSingular();
            let nlp_json=nlp(answer_array[i]).nouns().toSingular().json();

            console.log("answer_array[i]=",answer_array[i]," nlp_nouns=",nlp_nouns.json()," nlp_singular=",nlp_singular.json());
         /*  if(nlp_singular.json().length===1) {
               answer_array[i]=answer_array[i].replace(new RegExp(nlp_nouns.json()[0].text+"s?","i"),nlp_singular.json()[0].text);
           }*/
                       answer_array[i]=answer_array[i].replace(/\'s$/,"");

             var search_str=answer_array[i];
            console.log("bop0, i=",i);
            answer_array[i]=answer_array[i].replace(/^(a|the)\s/i,"").replace(/US\s/,"United States ").replace(/European$/,"Europe");
          //  answer_array[i]=answer_array[i].replace(/(America)n/,"$1").replace(/Dutch(\s|$)/,"Netherlands$1");
            let j;
            if(/New York/.test(answer_array[i])) {
                GM_setValue("returnHit",true);
                return;
            }
  //          if(!/ or /.test(h3)) {
//for(j of places) { search_str=search_str+" "+j.text; }

        search_str=search_str+" site:wikidata.org";
            if(/^[\d\'\",\.]*(\smillion)?,?\s*$/.test(answer_array[i])) {
                console.log("bop1");
                entityWiki[i].value=answer_array[i].replace(/,\s*$/,"").trim();
                my_query.done[i]=true;
                submit_if_done();
            }
            else {
                console.log("bop2");
              /*  let queryPromise = new Promise((resolve, reject) => {
                    //console.log("Beginning URL search for "+search_str);
                    query_search(search_str, resolve, reject, query_response,i);
                });
                queryPromise.then(query_promise_then)
                    .catch(function(val) {
                    console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
              let search_item=answer_array[i]//.replace(/,\s*$/,"").replace(/^The\s/i,"");
              var url=`https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${search_item}&srprop=`+
                  "size|wordcount|timestamp|sectiontitle|snippet|title|titlesnippet&utf8=&format=json";
                console.log("url=",url);
                do_wiki_call(url,search_item,i);

                   // (url,parse_wikidata,parse_wikidata_then,function() { console.log("Wikidata failed" + arguments); });
            /* let queryWikiPromise = new Promise((resolve, reject) => {
                  //  console.log("Beginning URL search for "+search_str);
                    query_search(answer_array[i]+" "+h3+" site:wikipedia.org", resolve, reject, query_response,"wiki"+i);
                });
                queryWikiPromise.then(query_wiki_promise_then)
                    .catch(function(val) {
                    console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
            }
        }
    }

})();