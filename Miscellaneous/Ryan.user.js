// ==UserScript==
// @name         Ryan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  News editors
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.google.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/373a2ebb90b1218f755df186d4bd7a9c812b6635/Govt/Government.js
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1ZU2IC5EYSPMF",false);
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
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
//        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        for(x in my_query.fields) {
            if(!my_query.fields[x]) is_done=false;
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else {
            console.log("Failed to get all fields");
            GM_setValue("returnHit",true);
        }
    }

    function compare_people(a,b) {
        return b.value-a.value; }

    function gov_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        console.log("contacts="+JSON.stringify(Gov.contact_list));
        console.log(Gov.email_list);
        var manager_re=/General Manager/i;
        var ed_re=/Editor/i;
        var rep_re=/(Reporter)|(Columnist)|(Staff Writer)|Correspondent/i;
        var health_re=/Health|COVID/i;
        var general_re=/(news|letters|desk|contact|assist)/i;
        var done={"Editor":false,"Journo":false,"General":false};
        var curr;
        var counter;

        var journo_list=[];
        var editor_list=[];




        for(curr of Gov.contact_list) {
            if(curr.email!==undefined) curr.email=curr.email.replace(/^20/,"");
            if(ed_re.test(curr.title)  && curr.email!=undefined && !/letters/i.test(curr.title) &&

              (/Managing Editor/i.test(curr.title)||/Editor(\-)?in(\-)?chief/i.test(curr.title)||/^Editor$/i.test(curr.title))) {
                counter=0;
                if(nlp(curr.name).people().out('terms').length>0) {
                    console.log("counter added for "+JSON.stringify(curr));
                    counter+=2;
                }
                editor_list.push({person:curr,value:12+counter});
//                Object.assign(my_query.fields,{"EditorEmail":curr.email,"EditorName":curr.name,"EditorTitle":curr.title});

                journo_list.push({person:curr,value:1});

            }
            if(ed_re.test(curr.title)  && curr.email!=undefined && !/letters/i.test(curr.title)) {
                counter=0;
                if(nlp(curr.name).people().out('terms').length>0) {
                    console.log("counter added for "+JSON.stringify(curr));
                    counter+=2;
                }
                editor_list.push({person:curr,value:8+counter});
//                Object.assign(my_query.fields,{"EditorEmail":curr.email,"EditorName":curr.name,"EditorTitle":curr.title});
               
                journo_list.push({person:curr,value:1});
                
            }
            else if(/Publisher/i.test(curr.title) && !done['Editor'] && curr.email!=undefined) {
                editor_list.push({person:curr,value:1});
                Object.assign(my_query.fields,{"EditorEmail":curr.email,"EditorName":curr.name,"EditorTitle":curr.title});

            }
            else if(done['Editor'] && !done['Journo'] && ed_re.test(curr.title)  && curr.email!=undefined) {
                console.log("editor -> Journo"+JSON.stringify(my_query.fields));
                journo_list.push({person:curr,value:2});
//                Object.assign(my_query.fields,{"JournoEmail":curr.email,"JournoName":curr.name,"JournoTitle":curr.title});
  //              if(/News/i.test(curr.title)) {
    //                done['Journo']=true;
      //          }

            }
            else if(!done['Editor'] && manager_re.test(curr.title) && curr.email!=undefined) {
                editor_list.push({person:curr,value:0.5});

                //Object.assign(my_query.fields,{"EditorEmail":curr.email,"EditorName":curr.name,"EditorTitle":curr.title});
            }
            else if(rep_re.test(curr.title) && curr.email!=undefined) {
                if(health_re.test(curr.title)) journo_list.push({person:curr,value:100});
                else if(/News /.test(curr.title) && !/sports/i.test(curr.title)) journo_list.push({person:curr,value:95});

                else if(/reporter/i.test(curr.title) && !/sports/i.test(curr.title)) journo_list.push({person:curr,value:80-curr.title.split(' ').length});
                else if(!/sports/i.test(curr.title)) journo_list.push({person:curr,value:50});
                else journo_list.push({person:curr,value:3.5});
               // console.log("rep_re.test("+curr.title+")="+rep_re.test(curr.title));
               
               // done['Journo']=true;
            }
            else if(/Staff/.test(curr.title)) {
                editor_list.push({person:curr,value:1.0});
                journo_list.push({person:curr,value:3.0});
            }
        }
        journo_list.sort(compare_people);
        editor_list.sort(compare_people);
        console.log("journo_list="+JSON.stringify(journo_list));
        var i=0;
        if(editor_list.length>0) {
            for(i=0;i<journo_list.length&&journo_list[i].person.name===editor_list[0].person.name;i++) { }
            if(i>=journo_list.length&&journo_list.length>0) i=0;
            if(i<journo_list.length) {

                curr=journo_list[i].person;
                Object.assign(my_query.fields,{"JournoEmail":curr.email,"JournoName":curr.name,"JournoTitle":curr.title});
            }
        

            curr=editor_list[0].person;
            Object.assign(my_query.fields,{"EditorEmail":curr.email,"EditorName":curr.name,"EditorTitle":curr.title});
        }
        for(curr of Gov.email_list) {
            var begin_email=curr.email.replace(/@.*$/,"");
            if(general_re.test(begin_email) && !done['General'] && curr.email!=undefined) {
                my_query.fields['GeneralEmail']=curr.email;
                done['General']=true;
            }
        }
        if(my_query.fields['GeneralEmail']==='' && my_query.fields['EditorEmail']!=='') {
            my_query.fields['GeneralEmail']=my_query.fields['EditorEmail'];
        }
        submit_if_done();
    }

    function fillFields() {
        my_query.fields={'JournoEmail':'dead@dead.com','JournoName':'Dead Site','JournoTitle':'Dead Site','EditorName':'Dead Site',
                         'EditorEmail':'dead@dead.com',
                                          'EditorTitle':'Dead Site','GeneralEmail':'dead@dead.com'};
        submit_if_done();
    }

    function do_bad_page(doc,url,resolve,reject) {
        var is_bad=MTP.is_bad_page(doc,url);
        resolve(is_bad);

    }
    function is_bad_page_then(result) {
        console.log("is_bad_page_then,result="+result);
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;

        var submit,submitParent;
     

    
        var dont=document.getElementsByClassName("dont-break-out");
        var href;
        if(/google\.com/.test(window.location.href)) {
            href="http://www.baxterbulletin.com/";
        }
        else {
            submit=document.querySelector("#submitButton");
            submitParent=submit.parentNode;
                var my_button=document.createElement("input");
        Object.assign(my_button,{type:'button',value:'Filldead'});
        my_button.style.margin="10px";
        my_button.addEventListener("click",fillFields);
        submitParent.insertBefore(my_button,submit);

            href=dont[0].href;
        }
        my_query={url:href,fields:{'JournoEmail':'','JournoName':'','JournoTitle':'','EditorName':'','EditorEmail':'',
                                          'EditorTitle':'','GeneralEmail':''},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
         var dept_regex_lst=[/Staff|Newsroom/];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Reporter|Officer|Secretary|Assistant|Editor|Publisher/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};

        var promise=MTP.create_promise(my_query.url,do_bad_page,is_bad_page_then,function(result) {
            console.log("Failed at is_bad_page");
            return; });

        var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            fillFields();
            if(my_query.fields.email.length===0) my_query.fields.email="NA";
            my_query.done.gov=true;
            submit_if_done(); },query);
    }

    if(/google\.com/.test(window.location.href)) {
        init_Query();
    }

})();