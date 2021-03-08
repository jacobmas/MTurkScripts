// ==UserScript==
// @name         Ian
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape School data for Ian
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/358b7db57b67fb958eac7774d52c725a8f1f498a/School/School.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(40000,750+(Math.random()*1000),[],begin_script,"A2TC2ICQMURQN0",true);
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
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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

    function get_value(contact) {
        var ret=0;
        if(contact.email) ret+=10;
        if(!/Elementary/.test(contact.title)) ret+=1;
        return ret;
    }

    function cmp_contacts(a,b) {
        return get_value(b)-get_value(a);
    }


    function failed_search_func_ian(result) {
        console.log("result="+result);
    }
    function init_Query()
    {
        console.log("in init_query");
        var i;
        var namestuff=document.querySelector("form a").innerText;

        var state_len=0;
        var best_state='',city,name,state;
        var temp_regex,x,match;
        var s;
        console.log("namestuff="+namestuff);
        for(x in state_map) {
            temp_regex=new RegExp(x+"$");
            if((match=namestuff.match(temp_regex))&&match[0].length>state_len) {
                best_state=match[0];
                state_len=best_state.length;
            }
        }
        namestuff=namestuff.replace(best_state,"");
        state=best_state;
        console.log("namestuff="+namestuff);
        name=namestuff.match(/^.* School/);
        if(!name) { name=namestuff.match(/^.+ Academy/); }
                if(!name) { name=namestuff.match(/^.+Institute/); }

        if(!name) {
            console.log("Bad name");
            GM_setValue("returnHit",true);
            return;
        }
        namestuff=namestuff.replace(name[0],"");
        city=namestuff.trim();
        console.log("name="+name[0]+", city="+city+", state="+state);
         my_query={name:name[0],

                  fields:{},
                  done:{},
		  try_count:{"query":0,"bbb":0}, staff_list:[],
		  submitted:false};
        var promise=new Promise((resolve,reject) => {
        s=new School({name:name[0],city:city,state:state,type:"school",
                              title_str:["Principal","PRINCIPAL","Headmaster","Head of School"],
                              debug:true,failed_search_func:failed_search_func_ian,
                             title_regex:[/Principal|Headmaster|Head of School/i]},resolve,reject);
        });
        promise.then(function() {
            console.log("phone="+s.phone);
            s.contact_list.sort(cmp_contacts);
            console.log(s.contact_list);
            if(s.contact_list.length>0&&s.contact_list[0].email) {
                my_query.fields["Principal Name"]=s.contact_list[0].name;
                my_query.fields["Principal Email"]=my_query.fields["School Email"]=s.contact_list[0].email;
                my_query.fields["Principal Number"]=s.contact_list[0].phone?s.contact_list[0].phone:s.phone;
                submit_if_done();

            }
            else {
                GM_setValue("returnHit",true);
            }
            
        });
        
    }

})();