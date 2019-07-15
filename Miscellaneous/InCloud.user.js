// ==UserScript==
// @name         InCloud
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  LinkedIn
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/a793f9e42508411e7952f387e69d4dfac26c0084/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,1250+(Math.random()*1000),[],begin_script,"A2N4CGXL1BLBTQ",false);
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
        var lastditch_re;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if((b_context=doc.getElementById("b_context"))&&(parsed_context=MTP.parse_b_context(b_context))) {

             //   console.log("b_context="+b_context.innerHTML);
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.people&&!parsed_context.person) {
                    console.log("### parsed_context.people");
                    if(!my_query.found_good && found_good_person(parsed_context.people,{},resolve,reject,type)) return;
                }
                if(type==="query" && parsed_context.person&&parsed_context.person.experience) {
                    console.log("parsed_context.person");

                    if(parsed_context.person.experience.length>0) {
                        my_query.fields.currentLocation=parsed_context.Location;
                        var pos=0;
                        while(pos<parsed_context.person.experience.length-1&&/Board of Directors/i.test(parsed_context.person.experience[pos].title)) pos++;
                        my_query.fields.currentCompany=parsed_context.person.experience[0].company;
                        if(my_query.fields.currentCompany.split("-").length>2) my_query.fields.currentCompany=my_query.fields.currentCompany.replace(/\-/g," ");
                        my_query.fields.currentJobTitle=parsed_context.person.experience[0].title;
                        let x;
                        for(x of parsed_context.person.experience) {
                            if(MTP.matches_names(my_query.company,x.company.replace(/,\s*/g," "))) {
                                my_query.fields.companyJobTitle=x.title;
                                break;
                            }
                        }
                        if(!my_query.fields.companyJobTitle && parsed_context.Current) {
                            let my_re=/^([^,]*?)(?:,|\sat)\s(.*)/,my_match;
                            if((my_match=parsed_context.Current.match(my_re)) && MTP.matches_names(my_match[2].trim(),my_query.company)) {
                              my_query.fields.companyJobTitle=my_match[1].trim(); }
                        }
                        resolve("");
                        return;
                    }
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                 b_url=b_url.replace(/https:\/\/[^\.]*\./,"https://www.");
                console.log("b_url="+b_url+", my_query.linkedin_url="+my_query.linkedin_url+", equal="+(b_url===my_query.linkedin_url));
                if(/query/.test(type) && b_url===my_query.linkedin_url && my_query.try_count[type]<=4) {
                    
                    let temp_b_name=b_name.replace(/[\-\|]*\s*(linkedin\.com|LinkedIn)\s*$/i,"").replace(/\s\|.*$/,"")
                    .replace(/\.\.\.\s*$/,"").replace(/\s-\s/g," ");
                    if(try_last_ditch_parse(b_name,b_url,p_caption,i,resolve,reject,type,temp_b_name)) return;
                    //return;

                  /*  else {

                        return;

                    }*/
                }

            }
//            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/query/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.linkedin_url, resolve, reject, query_response,"query");
            return;
        }

        reject("Nothing found");
        return;
    }
    function try_last_ditch_parse(b_name,b_url,p_caption,i,resolve,reject,type,temp_b_name) {
        let split=b_name.replace(/[\-\|]*\s*(linkedin\.com|LinkedIn)\s*$/i,"").replace(/\s\|.*$/,"")
        .replace(/\.\.\.\s*$/,"").trim().split(/\s+-\s+/);
        var lastditch_re,match,lastditch_re2;
        var name_re;
        console.log("BLUNK "+b_name+", "+JSON.stringify(split));
        if(split.length>=2) {
            my_query.name=split[0].trim();
            my_query.title=split[1].trim();
            name_re=new RegExp("^(?:View\\s)?"+my_query.name.split(" ")[0]);
            p_caption=p_caption.replace(/^(.*?) the world\'s largest professional community[\.\s]*/,"")
            .replace(/listed on their profile[\.\s]*/,"").replace(/^.*?\.\.\.\s*/,"");
            console.log("last_ditch, p_caption="+p_caption);
            console.log("my_query="+JSON.stringify(my_query));
            var re_str=my_query.name+"\\s(.*?)(?:\\sat|,)\\s"+my_query.company+"\\s((?:[^,]*,\\s"+
                "(?:North Carolina|North Dakota|New Hampshire|New Mexico|New York|New Jersey|South Carolina|South Dakota|Rhode Island|United Kingdom|South Africa|"+
                "[^\\s\.]*))|(?:.*?\\sArea))";
            lastditch_re=new RegExp(re_str);
            var re_str2="^(.*?)\\s"+my_query.company+" [^\\.]*? – Present[^\\.]*\.\\s([^\\.•\-]*)";
            lastditch_re2=new RegExp(re_str2);
            if((match=p_caption.match(lastditch_re))&&match[1]&&match[2]) {
                Object.assign(my_query.fields,{currentLocation:match[2],currentJobTitle:match[1],companyJobTitle:match[1],currentCompany:my_query.company});
                resolve("");
                return true;
            }
            else if(!p_caption.match(name_re) && (match=p_caption.match(lastditch_re2))&&match[1]&&match[2]) {
                Object.assign(my_query.fields,{currentLocation:match[2],currentJobTitle:match[1],companyJobTitle:match[1],currentCompany:my_query.company});
                resolve("");
                return true;
            }

        }
        if(my_query.try_count[type]<=3) {
            my_query.try_count[type]++;
            if(my_query.try_count[type]===2) temp_b_name+=" "+my_query.company;
            if(my_query.try_count[type]===3) temp_b_name+=" "+my_query.company+" Location";
            if(my_query.try_count[type]===4) temp_b_name+=" "+my_query.company+" Present";
            //if(my_query.try_count[type]===3
            query_search(temp_b_name+"", resolve, reject, query_response,"query");
            return true;
        }
        else {
            console.log("Failed in last ditch");
          return false;
        }

    }



    function found_good_person(people,full,resolve,reject,type) {
        let curr_person;
        for(curr_person of people) {
            //console.log("state_map[my_query.state]="+state_map[my_query.state]);
            curr_person.name=curr_person.name.trim();//replace(/,.*$/,"").replace(/\s*\(Person\)/g,"")
            console.log("curr_person.name="+curr_person.name);
            let full=MTP.parse_name(curr_person.name.trim());
          //  console.log("@ full="+JSON.stringify(full)+", my_query.fullname="+JSON.stringify(my_query.fullname));
            if(true && !/LinkedIn/i.test(curr_person.name) && /\(Person\)/.test(curr_person.name)) {
                console.log("url="+curr_person.url);
                var search_str=decodeURIComponent(curr_person.url.match(/\?q\=([^&]*)&/)[1]).replace(/\+/g," ");
                console.log("### Found good person ");
                my_query.found_good=true;
                var filters=curr_person.url.match(/&filters\=([^&]*)/)[1];
                query_search(search_str,resolve,reject,query_response,type,filters);
//                var promise=MTP.create_promise(curr_person.url,query_response,resolve,reject,type);
               return true;
            }
        }
        return false;
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
        console.log("Done query");
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
        var is_done=true,x,is_done_dones;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Incomplete fields, returning");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i,match;
        var companyTitleLabel=document.querySelector("#companyJobTitle").labels[0];
        var company=companyTitleLabel.innerText.match(/Job Title at ([^:]*):/)[1];
       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.querySelector(".dont-break-out");
        my_query={company:company,name:"",
            linkedin_url:dont.href.replace(/\/$/,""),fields:{currentLocation:"",currentCompany:"",currentJobTitle:"",companyJobTitle:""},
                  done:{},submitted:false,found_good:false,try_count:{"query":0}};
	
        if((match=my_query.linkedin_url.match(/linkedin\.com\/in\/([\-a-z]+)\-([a-z0-9]+[0-9][a-z0-9]+)/))) {
            my_query.name=match[1].replace(/\-/g," ");
        }
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.linkedin_url+" "+my_query.company+" "+my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();