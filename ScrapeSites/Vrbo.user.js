// ==UserScript==
// @name         Vrbo
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Vrbo Melissa Halliburton
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2JJ44DJW5FK4Q",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

     function parse_vrbo(doc,url,resolve,reject) {
         console.log("url="+url);
         var script=doc.querySelectorAll("script");
         var curr,x,y;
         var script_re=/window\.__INITIAL_STATE__/;
         var script_re2=/window\.__INITIAL_STATE__\s*\=\s*(.*);/;
         var match;
         for(curr of script) {
             if(script_re.test(curr.innerHTML)) {
                 break;
             }
         }
        // console.log("curr.innerHTML="+curr.innerHTML);
         match=curr.innerHTML.match(script_re2);
         var bad_re=/All pet friendly homes require an additional pet fee/i;

         var parsed;
         try {
             parsed=JSON.parse(match[1]);
         }
         catch(exception) {
             console.log("Fail "+exception);
             my_query.fields.notesField="Bad link.";
             submit_if_done();
//             reject("");
             return;
         }
         var desc=parsed.listingReducer.description;
         console.log("description="+desc);
         desc=desc.replace(/(M)ax\.\s/i,"$1aximum ");
         let my_doc = nlp(desc),elem;
         let sent=my_doc.match("(pet|dog|cat|animal|dogs|cats|PETS|spayed|neutered|breed|breeds|off the furniture|four-legged|welcome horses)").sentences().json();
         var j;
         for(j=sent.length-1;j>0;j--) {
             if(sent[j].text===sent[j-1].text) {
                 sent.splice(j,1);
             }
         }
         for(x of sent) {
             //console.log("x="+JSON.stringify(x));
             if(!bad_re.test(x.text)&&!/\s*Keywords:/.test(x.text)) {
                 my_query.fields.petFee=my_query.fields.petFee+ (my_query.fields.petFee.length>0?" ":"")+x.text+(/\.$/.test(x.text)?"":". ");

             }
         }
         //console.log(sent);
         my_query.fields.petFee=my_query.fields.petFee.trim();
         submit_if_done();
        // console.log("match="+match);

    }
    function parse_vrbo_then(result) {
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var dont=document.getElementsByClassName("dont-break-out");

        var url=dont[0].href;
        my_query={url:url,fields:{petFee:""},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(url,parse_vrbo,parse_vrbo_then,function(result) {
            console.log("Failed "+result);
            GM_setValue("returnHit","true"); }
            );
    }

})();