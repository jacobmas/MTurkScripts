// ==UserScript==
// @name         Michael Iarrapino
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape School data for Iarrapino
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/ddc209cedb4b41c89373b636c34e0801a16a94a1/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/42f1b3124c7c6dfaeca8181e89b90f7520c605fc/School/School.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(40000,750+(Math.random()*1000),[],begin_script,"A2TIT7HWFZWN3W",true);
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
    function replace_colon(to_replace) {
        return to_replace.replace(/^[^:]*:\s*/,"");
    }

    function add_person(contact,i,prefix) {
        var fullname=MTP.parse_name(contact.name);
        my_query.fields[prefix+i+"firstname"]=fullname.fname;
        my_query.fields[prefix+i+"lastname"]=fullname.lname;
        my_query.fields[prefix+i+"title"]=contact.title;
        my_query.fields[prefix+i+"email"]=contact.email||"N/A";
        my_query.fields[prefix+i+"phone"]=contact.phone||"N/A";
    }

    function add_names(contact_list) {
        var x;
        var a_count=0,c_count=0;
        var fullname;
        for(x of contact_list) {
            if(/Counselor|Guidance/i.test(x.title)&&c_count<8&&!/Principal|School/.test(x.name)&&x.email) {
                add_person(x,++c_count,""); }
            else if(/Principal|Headmaster|Head of School|Dean of Students|Superintendent/.test(x.title) && a_count<8&&!/Principal|School/.test(x.name)&&x.email) {
                add_person(x,++a_count,"a"); }
        }


    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var stuff=document.querySelectorAll("crowd-form div p");
        var s;

        var li=document.querySelectorAll("ol li");
        for(i=0;i<=1;i++) {
            li[i].parentNode.removeChild(li[i]); }

        var al=li[2].querySelector("ol");
        al.parentNode.removeChild(al);

         my_query={name:replace_colon(stuff[0].innerText),
                   city:replace_colon(stuff[1].innerText),
                   state:replace_colon(stuff[2].innerText),
                   district:replace_colon(stuff[3].innerText),

                  fields:{},
                  done:{},
		  try_count:{"query":0,"bbb":0}, staff_list:[],
		  submitted:false};

        for(i=1;i<=8;i++) {
            my_query.fields["a"+i+"firstname"]="N/A";
            my_query.fields[i+"firstname"]="N/A";
            my_query.fields["a"+i+"lastname"]="N/A";
            my_query.fields[i+"lastname"]="N/A";
            my_query.fields["a"+i+"title"]="N/A";
            my_query.fields[i+"title"]="N/A";
            my_query.fields["a"+i+"email"]="N/A";
            my_query.fields[i+"email"]="N/A";
            my_query.fields["a"+i+"phone"]="N/A";
            my_query.fields[i+"phone"]="N/A";
        }


        var promise=new Promise((resolve,reject) => {
        s=new School({name:my_query.name,city:my_query.city,state:my_query.state,type:"school",
                              title_str:["Principal","PRINCIPAL","Headmaster","Head of School","Dean of Students","Counselor","Guidance","Superintendent"],
                      dept_regex:[/Administration|Guidance|Counseling/i],
                              debug:true,failed_search_func:failed_search_func_ian,
                             title_regex:[/Principal|Headmaster|Head of School|Dean of Students|Counselor|Guidance|Superintendent/i]},resolve,reject);
        });
        promise.then(function() {
            var dir_list={},x;
            var admin_count=0,counselor_ct=0;
            for(x of s.contact_list) {
                if(dir_list[x.url]===undefined) dir_list[x.url]=1;
                else dir_list[x.url]+=1;
            }
            var max_count=0,max_url="";
            for(x in dir_list) {
                if(dir_list[x]>max_count) {
                    max_count=dir_list[x];
                    max_url=x;
                }
            }
            my_query.fields.urlstaffdirectory=max_url;
            my_query.fields.urldistrictwebsite=s.base;
            add_to_sheet();
            //console.log("s="+JSON.stringify(s));
            console.log("phone="+s.phone);
            s.contact_list.sort(cmp_contacts);
            console.log(s.contact_list);
            if(s.contact_list.length>0) {
                add_names(s.contact_list);
                submit_if_done();
                return;
            }
            else {
                GM_setValue("returnHit",true);
            }

        });

    }

})();