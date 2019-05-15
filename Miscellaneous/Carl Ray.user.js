// ==UserScript==
// @name         Carl_Ray
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Roster for College Sports
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var url_list=GM_getValue("url_list",[]);
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"ACZ9BYT6WMPTR",false);
    var MTP=MTurkScript.prototype;
     var sport_map1={
        "Baseball":["baseball","bsb"],
        "Field Hockey":["fhockey","fhock"],
        "Football":["football"],

        "Men's Basketball":["mbball"],
        "Men's Soccer":["msoc"],
        "Men's Swimming": ["mswim","swim","msd"],
        "Men's Track and Field":["mtrack","m-track","track"],
        "Men's Water Polo": ["mwpolo"],
        "Softball": ["softball","sball"],
        "Women's Basketball":["wbball"],
        "Women's Soccer":["wsoc"],
        "Women's Swimming":["wswim","swim","wsd"],
        "Women's Volleyball":["wvball","vball","volleyball","w-volley"],
        "Wrestling":["wrestling"],
    "Men's Wrestling":["wrestling"]};
    var sport_map1a={"Field Hockey":"fhock"};
    var sport_map2={"Men's Basketball":["mbkb","m-baskbl"],
                    "Men's Soccer":["msoc","m-soccer"],
                    "Football":["fball","m-footbl"],
                    "Women's Basketball":["wbkb","w-baskbl"],
                    "Women's Volleyball":["wvball","w-volley"],
                    "Men's Swimming":["mswimdive","mswim","swim","swimdive","m-swim"],
                    "Men's Water Polo": ["mwaterpolo"],

                    "Women's Swimming":["wswim","wswimdive","swim","swimdive","w-swim"],
                    "Field Hockey":["fh"],
                    "Women's Soccer":["wsoc","w-soccer"],
                   "Men's Wrestling":["wrest"]
                   };
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                if(/query/.test(type)) b_url=fix_for_roster(b_url);
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/query/.test(type) && is_good_roster(b_url,b_name,p_caption) && (b1_success=true)) break;

            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        b_url=b_algo[0].getElementsByTagName("a")[0].href;

        my_query.fields.Q1Url="NONE";
        //add_to_sheet();
        submit_if_done();

        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.Q1Url=result;
        url_list.push(result);
        GM_setValue("url_list",url_list);

        submit_if_done();
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    /* Change to correct roster site */
    function fix_for_roster(b_url) {
        b_url=fix_for_prestosports(b_url);
        b_url=fix_for_sidearmsports(b_url);
        return b_url;
    }

    function fix_for_prestosports(b_url) {
        var lst=sport_map1[my_query.sport_apos];
        var x,match;

        for(x of lst) {
            let re1=new RegExp("\\/sports\\/"+x+"\\/index"),re2=new RegExp("\\/sports\\/"+x+"\\/([^\\/]*)\\/roster");
        //    console.log("x="+x+", re="+re1);
            if(b_url.match(re1)) {
             //   console.log("matched re with "+b_url);
                b_url=b_url.replace(/\/index$/,"/2018-19/roster");
                 //  console.log("now b_url="+b_url);
            }
            if((match=b_url.match(re2))) {
               // console.log("matched re2 with "+b_url+", match="+JSON.stringify(match));
                if(match[1]!=="2018-19") {
                  //  console.log("bad year");
                   // b_url="";
                }

            }
        }
        return b_url;
    }

    function fix_for_sidearmsports(b_url) {
        var lst=sport_map1[my_query.sport_apos];
        var x,match,found=false;
         let re1=new RegExp("\\/index.aspx\\?path\\=(.*)$");
        match=b_url.match(re1);
        if(match) {
            for(x of lst) {

                //    console.log("x="+x+", re="+re1);
                if(match[1]===x) {

                    b_url=b_url.replace(re1,"/roster.aspx?path="+x);
                    found=true;
                    break;
                    //   console.log("sidearm: now b_url="+b_url);
                }
            }
           // if(!found) b_url="";
        }
        return b_url;
    }

    function is_good_roster(b_url,b_name,p_caption) {
        var temp_bname=b_name.replace(/[’\']+/g,"");
        if(b_url.length===0) return false;
        console.log("temp_bname="+temp_bname+", my_query.sport="+my_query.sport);
        if(!((b_name.indexOf(my_query.short_uni)!==-1||p_caption.indexOf(my_query.short_uni)!==-1) &&
           (/Roster/i.test(b_name)||/roster/i.test(b_url)))) return false;


        return true;
    }
    function paste_url(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        url_list.push(text);
        GM_setValue("url_list",url_list);
        my_query.fields.Q1Url=text;
        submit_if_done();
    }
    function init_Query()
    {
        console.log("in init_query");
        var i;
        var name=document.querySelector("form h2 b").innerText.trim();
        my_query={name:name,fields:{},done:{},submitted:false,university:"",sport:""};
        var re=/^(.*) ((?:Men’s|Women’s).*) Roster/,match;
        if((match=my_query.name.match(re))) {
        //    console.log("match="+JSON.stringify(match));
            my_query.university=match[1];
            my_query.short_uni=match[1].replace(/( University|College)$/,"").replace(/(,|( [-\(]+)).*$/,"").trim();
            console.log("my_query.short_uni="+my_query.short_uni);
            my_query.sport=match[2].replace(/’/g,"");
            my_query.sport_apos=match[2].replace(/’/g,"\'");
        }
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        document.getElementById("Q1Url").addEventListener("paste",paste_url);
      /*  var ath_search_str=my_query.university+" athletics";
        const athPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(ath_search_str, resolve, reject, query_response,"ath");
        });
        athPromise.then(ath_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();