// ==UserScript==
// @name         BrianHessionLinkedInTime
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/865c508cccbdb47c6f8d464d24a87dba0c557153/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3JYN1EC66FOSU",true);
    var MTP=MTurkScript.prototype;
    var month_list={"Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06","Jul":"07","Aug":"08","Sep":"09","Oct":"10","Nov":"11","Dec":"12"};
    function is_bad_name(b_name)
    {
        return false;
    }

    function matches_acronym(my_company, their_company) {
        if(/[^A-Z]+/.test(their_company)) return false;
        let my_acronym=my_company.replace(/([A-Z])([^\s]*(\s|$))/g,"$1");
        console.log("my_acronym=",my_acronym," their_company=",their_company);
        return my_acronym===their_company
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var person_name;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_algo.length===0) {
                console.log("Trying next");
	do_next_query(resolve,reject,type);
                return;
            }
              else {
                  b_name=b_algo[i].querySelector("h2 a").textContent;
                  b_url=b_algo[i].querySelector("h2 a").href;
                  b_caption=b_algo[i].getElementsByClassName("b_caption");
                  p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                      p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                  person_name=b_name.replace(/\s\-\s.*$/,"").trim();
              }
           // console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));

            if(parsed_context.person&&parsed_context.person.experience&&parsed_context.person.experience.length>0 &&
               (my_query.url.replace(/.*linkedin\.com/,"")===parsed_context.person.linkedin_url.replace(/.*linkedin\.com/,"")||
                my_query.name===parsed_context.person.name.toLowerCase())
              ) {
                                    console.log("hasperson");

                if(MTP.matches_names(my_query.short_company,parsed_context.person.experience[0].company)||
                   parsed_context.person.experience[0].company.indexOf(my_query.short_company.replace(/\s.*$/,""))!==-1 || matches_acronym(my_query.short_company,parsed_context.person.experience[0].company)) {
                    console.log("Matchcompany");
                    let my_time=parsed_context.person.experience[0].time;
                    let split_time=my_time.split(" - ");
                    if(split_time.length===2){
                        if(/Present/i.test(split_time[1])) {
                            document.querySelector("#present").click();
                        }
                        else {
                            let split_second=split_time[1].split(" ");
                            document.querySelector("#endMonth").value=month_list[split_second[0]];
                            document.querySelector("#endYear").value=split_second[1];

                        }
                         let split_first=split_time[0].split(" ");
                        let month=split_first.length===2?split_first[0]:"";
                        let year=split_first.length===2?split_first[1]:split_first[0];
                        console.log("month=",month);
                        console.log("year=",year);
                    document.querySelector("#startMonth").value=month_list[month]||"NONE";
                    document.querySelector("#startYear").value=year;
                        resolve("");
                        return;
                    }


                }
            }
            else if(parsed_context.people &&parsed_context.people.length>0 && my_query.try_count[type]<3) {
                my_query.try_count[type]++;
                let person;
                let company_regex=new RegExp(my_query.short_company);
                for(person of parsed_context.people) {
                    if(!/ is a /.test(person.title) && (MTP.matches_names(person_name,person.name)||company_regex.test(person.title) || parsed_context.people.length===1)) {
                        console.log("Trying person",person);
                        GM_xmlhttpRequest({method: 'GET', url: person.url,
                           onload: function(response) {query_response(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail  sadf"); },ontimeout: function(response) { reject("Fail asdfasdf"); }
                          });
                                        return;

                    }
                }

            }
            else if(b_url===my_query.url&&my_query.try_count[type]<3) {
                my_query.try_count[type]++;
                query_search(person_name+" "+my_query.company,resolve,reject,query_response,"query");
                return;
            }
             for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if( my_query.url.replace(/.*linkedin\.com/,"")===b_url.replace(/.*linkedin\.com/,"")&&my_query.try_count[type]<2) {
                    my_query.try_count[type]++;
                                query_search(b_name+" site:linkedin.com", resolve, reject, query_response,"query");
                    return;

                }
            }
            if(b1_success && (resolve(b_url)||true)) return;

        }
          //  if(b1_success && (resolve(b_url)||true)) return;
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
                        my_query.try_count[type]++;

            query_search(my_query.url+" "+my_query.short_company+" linkedin.com", resolve, reject, query_response,"query");
            return;
        }
        else if(my_query.try_count[type]===1) {
                        my_query.try_count[type]++;

            query_search(my_query.url, resolve, reject, query_response,"query");
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
       var url=document.querySelector("crowd-form p a").href;
        url=url.replace(/(\.linkedin\.com)\/pub\/([^\/]*)\/([^\/]+)\/([^\/]+)\/([^\/]+)/,"$1/in/$2-$5$4$3").replace(/\?.*$/,"").replace(/\/$/,"").trim();
        console.log("url=",url);
        var company=document.querySelectorAll("crowd-form div p")[1].innerText.trim().replace(/^[^:]*:\s*/,"");
        let short_url=url.replace(/https?:\/\/.*linkedin\.com/,""),match;

        my_query={name:"",company:company, short_company:MTP.shorten_company_name(company).replace(/ holdings$/i,""), url:url,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        if((match=short_url.match(/([a-z]+)\-([a-z]+)-([0-9a-f]{7})/))) {
            my_query.name=match[1]+" "+match[2];
        }
	console.log("my_query="+JSON.stringify(my_query));
        var search_str="+"+my_query.url;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();