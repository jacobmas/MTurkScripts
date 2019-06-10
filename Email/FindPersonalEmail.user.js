// ==UserScript==
// @name         FindPersonalEmail
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Better version of personal email for bing
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant GM_deleteValue
// @grant  GM_getValue
// @grant GM_setValue
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js

// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/app.lead411.com",".zoominfo.com",".privateschoolreview.com",".facebook.com",".niche.com","en.wikipedia.org",".yelp.com","hunter.io",
                 ".zoominfo.com","issuu.com","linkedin.com","downloademail.info","www.skymem.com"];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A1FS8KQVU1SUKC",true);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    function is_bad_name(b_name)  { return false; }

    /* Parse a single bing search result on a page */
    function query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success) {
        var b_name,b_url,p_caption,b_caption;
        var short_name,full_short;
        var mtch,j,people;
        b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
        b_url=b_algo[i].getElementsByTagName("a")[0].href;
        b_caption=b_algo[i].getElementsByClassName("b_caption");
        p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
            p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
        short_name=b_name.replace(/\s[\-\|\,]+.*$/,"").replace(/,.*$/,"").trim();
        full_short=MTP.parse_name(short_name);

        console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
        if(type==="email" && (mtch=p_caption.match(my_email_re))) {
            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push({email:mtch[j],url:b_url});
        }
        if(type==="email") {
            if(i>3) return null;
            else if(!/\.(pdf|xls|xlsx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        }
        // Parse the query pages where person and company are searched for
        if(type==="query" && i < 3&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        if((type==="query"||(type==="temp_query")) && /linkedin\.com\/in/.test(b_url) &&
           ((full_short.fname===my_query.fullname.fname &&
             full_short.lname.indexOf(my_query.fullname.lname)!==-1) ||
            (b_url.indexOf(my_query.fullname.fname.toLowerCase())!==-1 && b_url.indexOf(my_query.fullname.lname.toLowerCase())!==-1)
                                                               ) && !my_query.redone_linkedin) {
            console.log("MATCHED short_name, my_query.name for linkedin");
            my_query.redone_linkedin=true;

            var search_str=//my_query.name+" "+b_url.replace(/https?:\/\/[^\/]*\/in\//,"");
                b_name.replace(/[\-\|\,]*\s*LinkedIn\s*$/i,"").replace(/\.\.\.\s*$/,"");
            if(search_str.replace(/^[^\-]*\s-\s*/,"").indexOf("linkedin")!==-1 && !my_query.temp_redo) {
                my_query.temp_redo=true;
                my_query.redone_linkedin=false;
                search_str="\""+my_query.name+"\" "+b_url.replace(/https?:\/\/[^\/]*\/in\//,"");
            }
            const redonequeryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search with "+search_str);
                query_search(search_str, resolve, reject, query_response,"temp_query");
            });
            redonequeryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); my_query.done.redone_query=true;
            submit_if_done(); });
            if(my_query.temp_redo && !my_query.redone_linkedin) return true;
        }
        if(type==="url" && !MTP.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name) && (b1_success=true)) return b_url;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser().parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a,result;
        var b_url, b_name, b_factrow,lgb_info, b_caption,p_caption,loop_result;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,parsed_loc;
        var promise_list=[];
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            console.log("CHU");
            if((b_context=doc.getElementById("b_context"))&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("MOO");
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.people) {
                    console.log("### parsed_context.people");
                    if(!my_query.found_good && found_good_person(parsed_context.people,resolve,reject,type)) {  return; }
                }
                if(type==="url" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,5) && (resolve(parsed_context.url)||true)) return;
                if(type==="query" && parsed_context.person&&parsed_context.person.experience) {
                    console.log("parsed_context.person");
                    if(parsed_context.person.experience.length>0) my_query.company=parsed_context.person.experience[0].company.replace(/\-/g," ");
                }
            }
            if((lgb_info=doc.getElementById("lgb_info"))&&
               (parsed_lgb=MTP.parse_lgb_info(lgb_info))) console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success);
                if(b_url&&(b1_success=true)) break;
            }
            if(type==="email") {
                Promise.all(promise_list).then(function() { done_promises_then({type:type,resolve:resolve,reject:reject}); })
                    .catch(function() { done_promises_then({type:type,resolve:resolve,reject:reject}) });
                return; }
            if(b1_success && (resolve(b_url)||true)) return;
            if(type==="query") {
                Promise.all(promise_list).then(function() { done_promises_then({}); });
                resolve("");
                return;
            }
            if(type==="url" && parsed_lgb&&parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,5) && (resolve(parsed_lgb.url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="query" && (resolve("")||true)) return;

        reject("Nothing found");
        return;
    }
    /**
     * Use bing's finding a person thing on the right-hand side
     */
    function found_good_person(people,resolve,reject,type) {
        let curr_person;
        for(curr_person of people) {
            //console.log("state_map[my_query.state]="+state_map[my_query.state]);
            curr_person.name=curr_person.name.replace(/,.*$/,"").replace(/\s*\([^\)]*\)/g,"").trim();
            console.log("curr_person.name="+curr_person.name);
            let full=MTP.parse_name(curr_person.name.trim());
            console.log("@ full="+JSON.stringify(full)+", my_query.fullname.lname="+my_query.fullname.lname);
            if(full.lname.indexOf(my_query.fullname.lname)===-1) continue;
            if(true) {
                console.log("url="+curr_person.url);
                var search_str=decodeURIComponent(curr_person.url.match(/\?q\=([^&]*)&/)[1]).replace(/\+/g," ");
                console.log("### Found good person ");
                my_query.found_good=true;
                query_search(search_str,resolve,reject,query_response,type);
//                var promise=MTP.create_promise(curr_person.url,query_response,resolve,reject,type);
               return true;
            }
        }
        return false;
    }


    /* TODO: add these three to MTurkScript */
    var reverse_str=function(str) {
        var ret="",i;
        for(i=str.length-1;i>=0;i--) ret+=str.charAt(i);
        return ret;
    };


    /**
     * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,resolve,reject,query) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;

        var begin_email=my_query.fields.email,clicky;
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        //for(x=0;x<scripts.length;x++) { scripts[x].innerHTML=""; }

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Staff|Coach)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        MTP.fix_emails(doc,url);
        console.log("& doc.body.innerHTML.length="+doc.body.innerHTML.length);

        console.time("beforeemailmatchesnew");

        if((email_matches=doc.body.innerHTML.match(my_email_re))) {
            //console.log("EMAILMATCHESNEW: "+JSON.stringify(email_matches));
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0) my_query.email_list.push({email:email_matches[j].toString(),url:url});
            }
//            console.log("Found email hop="+my_query.fields.email);
        }
        console.timeEnd("beforeemailmatchesnew");


        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++) {

            if(my_query.fields.email.length>0) continue;
            try
            {
                if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
                   !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push({email:temp_email.toString(),url:url});

            }
            catch(error) { console.log("Error with emails "+error); }
        }
        console.log("* doing doneQueries++ for "+url);

        resolve(query);
        return;
    };

    function done_promises_then(query) {
        console.log("Done contact_response");
        evaluate_emails(query);
    }

    function remove_dups(lst) {
        console.log("lst="+JSON.stringify(lst));
        for(var i=lst.length-1;i>0;i--) if(lst[i].email===lst[i-1].email) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name, really need nicknames json */
    function evaluate_emails(query) {
        console.log("name="+JSON.stringify(my_query.fullname));
        for(i=0;i<my_query.email_list.length;i++) {
            my_query.email_list[i].email=my_query.email_list[i].email.replace(/^[^@]+\//,"").replace(/(\.[a-z]{3})yX$/,"$1"); }
        my_query.email_list.sort(function(a,b) {

            try {
                if(a.email.split("@")[1]<b.email.split("@")[1]) return -1;
                else if(a.email.split("@")[1]>b.email.split("@")[1]) return 1;
                if(a.email.split("@")[0]<b.email.split("@")[0]) return -1;
                else if(a.email.split("@")[0]>b.email.split("@")[0]) return 1;
                else return 0;
            }
            catch(error) { return 0; }
        });
        remove_dups(my_query.email_list);
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        var my_email_list=[],i,curremail;
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];
        /* Judges the quality of an email */
        function EmailQual(email,url) {
            this.email=email;
            this.url=url;
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            if(new RegExp(my_query.fullname.fname,"i").test(email)) this.quality=1;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email)) {
                this.quality=2;
                if(email.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email.toLowerCase().charAt(0)) this.quality=3;
            }
            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=4;
            if(this.domain===my_query.domain&&this.quality>0) this.quality+=4;
        }
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(MTP.is_bad_email(my_query.email_list[i].email)) continue;
            curremail=new EmailQual(my_query.email_list[i].email.trim(),my_query.email_list[i].url);
            if(curremail.quality>0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return a.quality-b.quality; });
        console.log("my_email_list="+JSON.stringify(my_email_list));
        if(my_email_list.length>0) {
            var temp=my_email_list.pop();
            my_query.fields.email=temp.email;
            my_query.fields.url=temp.url;

            submit_if_done();
            return true;
        }
        else if(query.resolve&&query.reject&&do_next_email_query(query.resolve,query.reject)) return false;
        else if(query.resolve&&query.reject) query.reject("Failed nothing found");
        return false;
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

    function query_promise_then(result) {
        console.log("query_promise_then, result="+result);
        var search_str=my_query.company;
        const urlPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"url");
        });
        urlPromise.then(url_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

    /* Following finding the domain */
    function url_promise_then(result) {
        console.log("# url_promise_then,result="+result);
        my_query.domain=MTP.get_domain_only(result,true);
        var lname=my_query.fullname.lname.replace(/\'/g,""),fname=my_query.fullname.fname.replace(/\'/g,"");
        var curr_email=fname.charAt(0).toLowerCase()+lname.toLowerCase()+"@"+my_query.domain;
        var search_str="+\""+curr_email+"\"";// OR "+
         //   "+\""+lname.toLowerCase()+fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\"";
        console.log("new search_str for emails ="+search_str);
        do_mailtester_query(curr_email);

        const emailPromise = new Promise((resolve, reject) => {
            console.log("$ Beginning Email search");
            query_search(search_str, resolve, reject, query_response,"email");
        });
        emailPromise.then(email_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    function do_mailtester_query(email) {

        var url="http://mailtester.com/testmail.php";
        var data={"lang":"en","email":email};
         var headers={"host":"mailtester.com","origin":"http://mailtester.com","Content-Type": "application/x-www-form-urlencoded",
                     "referer":"http://mailtester.com/testmail.php"};
        var data_str=MTP.json_to_post(data);
         console.log("do_mailtester_query, email="+email+", data_str="+data_str);
        var promise=new Promise((resolve,reject) => {

            GM_xmlhttpRequest({method: 'POST', headers:headers,data:data_str,anonymous:true,
                               url: url,
                               onload: function(response) {
                                   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                   mailtester_response(doc,response.finalUrl, resolve, reject,email); },
                               onerror: function(response) { reject("Fail mailtester"); },ontimeout: function(response) { reject("Fail"); }
                              });
        });
    }
    function mailtester_response(doc,url,resolve,reject,email) {
        console.log("mailtester_response,doc.body.innerHTML.length="+doc.body.innerHTML.length);
      // console.log(doc.body.innerHTML);
        var table=doc.querySelector("#content > table");
        if(table) {
       //    console.log("div.innerHTML="+div.innerHTML);
            let lastRow=table.rows[table.rows.length-1];
            let lastCell=lastRow.cells[lastRow.cells.length-1];
            console.log("lastCell="+lastCell.outerHTML);
            if(lastCell.innerText.indexOf("E-mail address is valid")!==-1) {
                my_query.email_list.push({email:email,url:url});
                my_query.found_with_mailtester=true;
                evaluate_emails();

            }
            else if(lastCell.innerText.indexOf("Server doesn't allow e-mail address verification")!==-1) {
                // Don't waste precious queries
                my_query.found_with_mailtester=true;
            }

        }
        else {
            console.log("doc.body.innerHTML="+doc.body.innerHTML);
        }
    }

    function do_next_email_query(resolve,reject) {
        var search_str;
        console.log("do_next_email, query, try_count.email="+my_query.try_count.email);
        var email_types=[my_query.fullname.fname.toLowerCase()+"."+my_query.fullname.lname.toLowerCase()+"@"+my_query.domain,
                         my_query.fullname.lname+"@"+my_query.domain];
        if(my_query.try_count.email<email_types.length) {
            let curr_email=email_types[my_query.try_count.email];
            my_query.try_count.email++;
            search_str="+\""+curr_email+"\"";
            if(!my_query.found_with_mailtester) do_mailtester_query(curr_email);
            //console.log("trying email again with "+search_str);
            query_search(search_str,resolve,reject,query_response,"email");
            return true;
        }
        return false;
    }


    function email_promise_then(result) {
        console.log("In email_promise_then, result="+result); }

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

    function parse_initial_params_Bryan() {
        var p=document.querySelectorAll("form div div p");
        var re=/^[^:]*:\s*/;
        my_query.name=p[0].innerText.replace(re,"").trim();
        let fullname=MTP.parse_name(my_query.name);
        Object.assign(my_query,{first:fullname.fname,last:fullname.lname});
        my_query.location=p[1].innerText.replace(re,"");
        my_query.company=p[2].innerText.replace(re,"");
        my_query.fullname=fullname;
        my_query.company=my_query.company.replace(/^.* AS REPRESENTED BY THE [^,]*,/,"");
        my_query.company=MTP.shorten_company_name(my_query.company);
    }



    function init_Query()
    {
        console.log("in init_query");
        var i,promise,st;
        bad_urls=bad_urls.concat(default_bad_urls);
     //   var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];

        my_query={fields:{email:"",url:""},done:{},submitted:false,try_count:{"email":0},email_list:[],emails_to_try:[],found_with_mailtester:false};
        parse_initial_params_Bryan();
        console.log("my_query="+JSON.stringify(my_query));

        add_to_sheet();

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.first+" "+my_query.last+" "+my_query.company+" ", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });


    }

})();