// ==UserScript==
// @name         Zeptive
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(40000,750+(Math.random()*1000),[],begin_script,"A56TPLQUC3IDV",true);
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
        var name_nlp=nlp(contact.name).people().json();
        if(name_nlp.length>0) ret+=2;
        if(contact.email) ret+=10;
        if(/School|Home|(^Thanks )/.test(contact.name)) ret=0;
        if(/^(Dean|Principal)$/.test(contact.title)) ret+=5;
        if(/Principal|Dean/.test(contact.title)) ret+=2;
        if(/High School|Secondary/.test(my_query.name) && /HS|High School|Secondary/.test(contact.title)) ret+=2;
        if(/Middle School/.test(my_query.name) && /MS|Middle School/.test(contact.title)) ret+=2;
        if(/Elementary School/.test(my_query.name) && /ES|Elementary School/.test(contact.title)) ret+=2;

        return ret;
    }

    function cmp_contacts(a,b) {
        return get_value(b)-get_value(a);
    }

    function sort_for_reduce(a,b) {
        if(a.name< b.name) {
            return -1;
        }
        else if(a.name>b.name) {
            return 1;
        }
        else if(a.email && !b.email) return -1;
        else if(b.email && !a.email) return 1;
        else return 0;
    }

    function reduce_contact_list(contacts) {
        contacts=contacts.sort(sort_for_reduce);
        var i;
        for(i=contacts.length-1;i>0;i--) {
            if(contacts[i].name===contacts[i-1].name) {
                contacts.splice(i,1);
            }
        }
    }

    function failed_search_func_ian(result) {
        console.log("result="+result);
         GM_setValue("returnHit",true);
    }

    var asst_re=/Assistant|Asst|Vice/i;

    function filter_assistant_principal(contact) {
        return asst_re.test(contact.title);
    }
    function filter_principal(contact) {
        return !asst_re.test(contact.title);
    }



    function init_Query()
    {
        console.log("in init_query");
        var i;
        var namestuff=decodeURI(document.querySelector("form a").href.replace("https://www.google.com/search?q=",""));


        var state_len=0;
        var best_state='',city,name,state;
        var temp_regex,x,match;
        var s;
        let namebob=namestuff.split('+');
        console.log("namebob="+namebob);

        name=namebob[0];
        city=namebob[1];
        state=namebob[2];
         my_query={name:name,

                  fields:{},
                  done:{},
		  try_count:{"query":0,"bbb":0}, staff_list:[],
		  submitted:false};
        var promise=new Promise((resolve,reject) => {
        s=new School({name:name+" school website",city:city,state:state,type:"school",
                              title_str:["Principal","PRINCIPAL","Headmaster","Head of School","Director"],dept_regex:[/Administration/],
                              debug:true,failed_search_func:failed_search_func_ian,
                             title_regex:[/Principal|Headmaster|Head of School|Program Administrator|(^Director$)|(^Executive Director)/i]},resolve,reject);
        });
        promise.then(function() {
            console.log("phone="+s.phone);
            reduce_contact_list(s.contact_list);
            var i,temp_name;
            for(i=0;i<s.contact_list.length;i++) {
                temp_name=MTP.parse_name(s.contact_list[i].name);
                s.contact_list[i].first=temp_name.fname;
                s.contact_list[i].last=temp_name.lname;
            }
            s.contact_list.sort(cmp_contacts);
            console.log(s.contact_list);
            var principals=s.contact_list.filter(filter_principal);
            var asst_principal=s.contact_list.filter(filter_assistant_principal);
            console.log("principals="+JSON.stringify(principals));
            console.log("assistant principals="+JSON.stringify(asst_principal));

            my_query.fields['schoolUrl']=s.url;
            var good=false;
            if(principals.length>0 && principals[0].email) {
                good=true;
                my_query.fields.emailPrincipal=principals[0].email.trim();
                my_query.fields.firstNamePrincipal=principals[0].first;
                my_query.fields.lastNamePrincipal=principals[0].last;
                my_query.fields.contactTitlePrincipal=principals[0].title.trim();
            }
            for(i=0;i<3 && i < asst_principal.length;i++) {
                my_query.fields["emailAp"+(i+1)]=asst_principal[i].email?asst_principal[i].email.trim():"";
                my_query.fields["firstNameAp"+(i+1)]=asst_principal[i].first;
                my_query.fields["lastNameAp"+(i+1)]=asst_principal[i].last;
                my_query.fields["contactTitleAp"+(i+1)]=asst_principal[i].title.trim();
                add_to_sheet();

            }
            if(good) {
                submit_if_done();

            }
            else {
                GM_setValue("returnHit",true);
            }

        }).catch(function(response) {
          my_query.fields.schoolUrl="https://deadsite.com";
            my_query.fields.emailPrincipal="dead@dead.com";
            document.querySelector("#checkmark").hidden=false;
            my_query.fields.firstNamePrincipal=my_query.fields.lastNamePrincipal=my_query.fields.contactTitlePrincipal="None";
            submit_if_done();

        });

    }

})();