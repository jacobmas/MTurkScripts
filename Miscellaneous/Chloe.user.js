// ==UserScript==
// @name         Chloe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  AirTable Shit
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://twitter.com/*
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
// @resource csv https://raw.githubusercontent.com/jacobmas/MTurkScripts/50a84ee879cf77f2f8899c8ba818db58f19c0159/js/chloe.csv
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {fields:{},done:{},
                      try_count:{"query":0},
                      submitted:false};
    var bad_urls=[];
    var begin_pos=301;
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(2000000000,750+(Math.random()*1000),[],begin_script,"A1UTS6B7ZOI5X3",true);
    var MTP=MTurkScript.prototype;
    function CSVToArray( strData, strDelimiter ){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }
        return arrData;
    }
    function is_bad_name(b_name)
    {
        return false;
    }

    if(/twitter\.com/.test(window.location.href)) {
        GM_addValueChangeListener("twitterphoto",function() {
            window.location.href=arguments[2];
        });
        setTimeout(parse_photo,1500);
    }
    function parse_photo() {
        var img=document.querySelector("img");
        var src=""
        if(!img) {
            src="N/A";
        }
        else src=img.src;
        GM_setValue("twitterphoto_url",img.src);
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
            if(type==="query"&&parsed_context.Title) {
                console.log("Resolving");
                my_query.arr[my_query.i][0]=parsed_context.Title;
                resolve(parsed_context.Title);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="twitter" &&  /twitter\.com/.test(b_url) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) &&
                   !MTurkScript.prototype.is_bad_name(b_name.replace(/\(.*$/,""),my_query.arr[my_query.i][1],p_caption,i)
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
        console.log("query_promise_then,result=",result);
        my_query.arr[my_query.i][1]=result.replace(/\n/g,"");
        var search_str=my_query.arr[my_query.i][1]+" twitter";// site:twitter.com";
        const twitterPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response,"twitter");
            });
            twitterPromise.then(twitter_promise_then)
                .catch(function(val) {
                console.log("Failed at this twitterPromise " + val);
                my_query.i=my_query.i+1;
                do_queries(my_query.i);
            });

    }

    function twitter_promise_then(result) {
        console.log("twitter_promise_then,result=",result);
        my_query.arr[my_query.i][2]=result.replace(/\n/g,"");;
        GM_setValue("twitterphoto",result.replace(/\/$/,"")+"/photo");
      /*  var promise=MTP.create_promise(result+"/photo",parse_twitter_photo, parse_twitter_photo_then,
                                       function() {
            console.log("Failed at this twitterPromise " );
            my_query.i=my_query.i+1;
            do_queries(my_query.i);
            return;
        });*/

    }
    function parse_twitter_photo(doc,url,resolve,reject) {
        console.log("doc=",doc.body.innerHTML);
    }

    function parse_twitter_photo_then() {
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


        var text=GM_getResourceText("csv");
        console.log(text);
        var split_text=text.split(/\r\n/).slice(1);
        var line, arr;
        arr=CSVToArray(text);
       //console.log(arr);
        my_query.arr=arr;
        my_query.i=begin_pos;
          GM_addValueChangeListener("twitterphoto_url",function() {
              my_query.arr[my_query.i][3]=arguments[2];
              my_query.i=my_query.i+1;
              do_queries(my_query.i);
        });

        var i;
        do_queries(my_query.i);

      
    }

    function do_queries(curr_pos) {
        var line;
        var is_done=false,j;
        var i;
        for(i=curr_pos;i<my_query.arr.length; i++) {
            if(i>442) {
                printCSV(my_query.arr);
                break;
            }
            line=my_query.arr[i];
            is_done=true;
            for(j=0;j<4;j++) {
                my_query.arr[i][j]=my_query.arr[i][j].replace(/\n/g,"");
                if(!line[j] ||line[j]==="N/A") {
                    console.log("i=",i,"j=",j);
                    is_done=false;
                }
            }
            if(is_done) continue;

            my_query.domain=line[0];
            my_query.i=i;
            //console.log("my_query="+JSON.stringify(my_query));
            var search_str=my_query.domain;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val);
                my_query.i=my_query.i+1;
                do_queries(my_query.i);
            });
            break;
        }
    }

    function printCSV(arr) {
        var i,j;
        var my_str="";
        for(i=begin_pos;i<arr.length;i++) {
            for(j=0;j<4;j++) {
                my_str=my_str+(j>0?",":"")+arr[i][j];
            }
            my_str=my_str+"\n";
        }
        console.log(my_str);
    }

})();