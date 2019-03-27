// ==UserScript==
// @name         GetBusEmail
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Business Email Dave Ter
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
// @grant  GM_getValue
// @grant GM_deleteValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {

    var my_query = {};
    var my_title_regex=/President|Founder|VP|CEO|Chief Executive Officer|Manager|Director/;
    var bad_urls=["issuu.com","constantcontact.com","compositesite.com",".composesite.com","en.wikipedia.org","imdb.com",".wikia.com",
                 "merriam-webster.com","pitchbook.com","kickstarter.com"];
    var MTurk=new MTurkScript(40000,200,[],begin_script,"A2FE3170ZRK5KN",false);
    var MTP=MTurkScript.prototype;
    var success=GM_getValue("success",0),fail=GM_getValue("fail",0);
    function is_bad_email(email)
    {
        if(email.indexOf("@example.com")!==-1 || email.indexOf("@email.com")!==-1 || email.indexOf("@domain.com")!==-1||
          /@wix\.com/.test(email)) return true;
        return false;
    }

    function is_bad_name(b_name)
    {
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase().split(" ")[0])===-1) return true;
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
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                 if(/info_query/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&
                    (MTP.get_domain_only(b_url,true)===MTP.get_domain_only(my_query.url,true)) &&
                    (b1_success=true)) break;
                if(!/info_query/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)  && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }
    function query_promise_then(result) {
        my_query.url=result;
        my_query.done.query=true;
        call_contact_page(my_query.url,submit_if_done,'');
    }
    function info_query_promise_then(result) {
        my_query.info_url=result;
        call_contact_page(result,info_query_then,'info');
    }
    function info_query_then() {
        my_query.done.info_query=true;
        submit_if_done();
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

    /* Following finding fb page */
    function fb_query_promise_then(result) {
        console.log("fb_query_promise_then,result="+result);
        my_query.fb_url=result;
        my_query.done.fb_query=true;
        my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
        console.log("my_query.fb_about_url="+my_query.fb_about_url);
        var fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
    }

    function add_to_sheet() {
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        var field_name_map={"email":"email"};
        var nlp_out,match;
        var x,field,i;
        // contactLastname
        if(my_query.email_list.length>0) {
            my_query.fields.email=evaluate_emails(); }
        if(my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            nlp_out=nlp(match[1]+" "+match[2]).people().out('topk');
            console.log("nlp_out="+JSON.stringify(nlp_out));
            if(nlp_out.length>0) {
                my_query.fields.contactFirstname=match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
                my_query.fields.contactLastname=match[2].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
            }
        }
        for(i=0;i<Gov.contact_list.length;i++) {
            var fullname=MTP.parse_name(Gov.contact_list[i].name);
            console.log("Gov.contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
            if(Gov.contact_list[i].title && my_title_regex.test(Gov.contact_list[i].title)&&Gov.contact_list[i].email &&
             Gov.contact_list[i].email.length>0&&!MTP.is_bad_email(Gov.contact_list[i].email)&&!/bluehost\.com/.test(Gov.contact_list[i].email)) {
                console.log("Success gov at "+i);
                my_query.fields.email=Gov.contact_list[i].email;
              //  my_query.fields.contactFirstname=fullname.fname;
                //my_query.fields.contactLastname=fullname.lname;
                break;
            }
            else if(my_query.fields.email.length===0 && Gov.contact_list[i].email.length>0&&!MTP.is_bad_email(Gov.contact_list[i].email)&&
                    !/bluehost\.com/.test(Gov.contact_list[i].email)) {
                my_query.fields.email=Gov.contact_list[i].email;
            break; }

        }


        for(x in my_query.fields) {
            if(document.getElementsByName(x).length>0 &&my_query.fields[x] && my_query.fields[x].length>0) {
                document.getElementsByName(x)[0].value=my_query.fields[x];

            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true;
             if(!my_query.found_fb) {
                 my_query.done.fb=true;
             }
         }
        console.log("MTurk.queryList="+JSON.stringify(MTurk.queryList));
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        console.log("****\n****Gov.contact_list="+JSON.stringify(Gov.contact_list));
        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length+", MTurk.doneQueries="+MTurk.doneQueries+", my_query.submitted="+
                   my_query.submitted);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&& my_query.pending_gov_promises===0 &&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length===0) {
                console.log("no email found, returning ");

                if(MTurk.assignment_id) {
                    GM_setValue("fail",fail+1);
                    GM_setValue("returnHit"+MTurk.assignment_id,true);
                    return;
                }
            }
            GM_setValue("success",success+1);

            //console.log("MTurk="+JSON.stringify(MTurk));
            MTurk.check_and_submit();

        }
    }
    function set_no_email() {
        my_query.fields.email="na@na.com";
        let checkbox=document.getElementsByName("noemail");
        if(checkbox&&checkbox.length>0) checkbox[0].checked=true;
    }

    /* Call contact_page works with contact_response */
    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='' || extension==='info') {
            extension=extension==='info'?extension:'';
                                   MTurk.queryList.push(url); }
        console.log("MOO");
        GM_xmlhttpRequest({method: 'GET', timeout:15000,url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            my_query.pending_gov_promises++;
             let promise=new Promise((resolve,reject) => { Gov.load_scripts(doc,response.finalUrl,resolve,reject); })
             .then(my_gov_parse_contacts_then);
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                        MTurk.doneQueries++;
                                                        if(extension==='' && !/https?:\/\/www\./.test(url)) {
                                                            call_contact_page(url.replace(/(https?:\/\/)/,"$1www."));
                                                            return; }
                                                        else if(extension==='') {
                                                            set_no_email();
                                                        }
                                                       // if(extension==='') my_query.fields.email="none@none.com";

                                                       if(callback) callback();
                                                        else submit_if_done();
                                                       },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          if(extension==='' && !/https?:\/\/www\./.test(url)) {
                                                            call_contact_page(url.replace(/(https?:\/\/)/,"$1www."));
                                                            return; }
                                                        else if(extension==='') {
                                                            set_no_email();
                                                        }
                                                          callback(); }
                          });
    };

    var filter_by_domain=function(value) { return value.toLowerCase().indexOf("@"+my_query.domain)!==-1; };

    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;

        var begin_email=my_query.fields.email;
        if(extension===undefined) extension='';
        if(MTP.is_bad_page(doc,url) && extension==='') {
            set_no_email();
            MTurk.doneQueries++;
            if(callback&&typeof(callback)==="function") callback();
            else submit_if_done();
            return;
        }

        MTP.fix_emails(doc,url);
        console.log("in contact_response "+url+", extension="+extension);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|People|Terms|Kontakt|Conta|Contatto)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        var url_contact_regex=/contact|kontakt/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*[\(\[\s]at[\)\]\s]\s*/,"@").replace(/\s*[\(\[\s]dot[\)\]\s]\s*/,".");
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            if(extension==='info') email_matches=email_matches.filter(filter_by_domain);
            my_query.email_list=my_query.email_list.concat(email_matches);
            for(j=0; j < email_matches.length; j++) {
                console.log("email_matches["+j+"]="+email_matches[j]);
                if(email_matches[j]&&email_matches[j].length>0 && !MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {
          //  if(my_query.fields.email.length>0) break;
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && (contact_regex.test(links[i].innerText)||
                                  (MTurk.queryList.length<5 && url_contact_regex.test(links[i].href)))

               && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)) &&
              !MTP.is_bad_url(links[i].href,bad_urls,-1))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            try {
                if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
                   !MTurkScript.prototype.is_bad_email(temp_email)) {
                    if(extension!=='info' || filter_by_domain(temp_email))  my_query.email_list.push(temp_email);
                }
            }
            catch(error) { console.log("error="+error+", links["+i+"]="+links[i].outerHTML+", temp_email="+temp_email); }


           
            if(/facebook\.com/.test(links[i].href) && !my_query.found_fb && extension!=='info') {
                my_query.found_fb=true;
                my_query.done.fb=false;
                console.log("***** FOUND FACEBOOK "+links[i].href);

                try {
                   fb_query_promise_then(links[i].href); }
                catch(error) { console.log("FBerror="+error);
                              my_query.done.fb=true;
                              submit_if_done();
                              return;
                             }
            }

        }
        if(extension==='' && links.length>0 &&
           MTurk.queryList.length==0

           && !bad_contact_regex.test(links[0].href) &&
           !MTurk.queryList.includes(links[0].href=MTurkScript.prototype.fix_remote_url(links[0].href,url)) &&
          MTP.get_domain_only(links[0].href,true)===MTP.get_domain_only(url,true)
          )
        {
            MTurk.queryList.push(links[0].href);
            console.log("*** Following link labeled "+links[0].innerText+" to "+links[0].href);
            call_contact_page(links[0].href,callback,"");

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        //if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        if(callback&&typeof(callback)==="function") callback();
        else submit_if_done();
        return;
    };
    function my_gov_parse_contacts_then(result) {
        my_query.pending_gov_promises--;

        submit_if_done();
    }

  function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) { my_query.email_list.push(result.email); }
        my_query.done["insta"]=true;
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback==undefined) callback=init_Query;
        if(MTurk!==undefined&&Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function is_bad_fb_url(url) {
        return /\/(pages|groups|events)\//.test(url); }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.email) my_query.email_list.push(result.email);
        my_query.done.fb=true;
        console.log("parse_fb_about_then, Setting done.fb=true");
        submit_if_done();
    }

    function remove_dups(lst) {
        for(var i=lst.length;i>0;i--) if(lst[i]===lst[i-1]) lst.splice(i,1);
    }

    function evaluate_emails() {
        console.log("name="+JSON.stringify(my_query.fullname));

        my_query.email_list.sort(function(a,b) {
            try {
                if(a.split("@")[1]<b.split("@")[1]) return -1;
                else if(a.split("@")[1]>b.split("@")[1]) return 1;
                if(a.split("@")[0]<b.split("@")[0]) return -1;
                else if(a.split("@")[0]>b.split("@")[0]) return 1;
                else return 0;
            }
            catch(error) { return 0; }
        });
        remove_dups(my_query.email_list);
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        var my_email_list=[],i,curremail;
               /* Judges the quality of an email */
        function EmailQual(email) {
            this.email=email.replace(/(\.(com|org|edu|net)).*$/,"$1");
            var reg=/^.*\u0007(.*@.*)$/;
         //  console.log("### reg="+reg.source);
            this.email=email.replace(reg,"$1");
            this.domain=email.replace(/^[^@]*@/,"").toLowerCase();
            this.quality=0;
            var email_begin=email.replace(/@[^@]*$/,"");
            if(/firstname\.lastname/.test(email_begin)) this.quality=-1;
            if(/[A-Za-z]{2,}\.[\-\'A-Za-z]{2,}/.test(email_begin)) this.quality=4;
            if(/market|commun/i.test(email_begin)) this.quality=3;
            else if (/social/.test(email_begin)) this.quality=2;
             else if (/info|contact/.test(email_begin)) this.quality=1;
            else if(/^[0-9]/.test(email_begin)) this.quality=-1;
            if(/[^A-Za-z0-9_\.\-_\`\{\|\}\~]+/.test(email_begin)) this.quality=-1;
            if(/bluehost\.com/.test(this.domain)) this.quality=-5;
            if(this.domain.indexOf(my_query.domain)!==-1&&this.quality>=0) this.quality+=5;

        }
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(MTP.is_bad_email(my_query.email_list[i])) continue;
            curremail=new EmailQual(my_query.email_list[i].trim());
            if(curremail.quality>=0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return b.quality-a.quality; });
        console.log("my_email_list="+JSON.stringify(my_email_list));
        if(my_email_list.length>0) {
            return my_email_list[0].email.match(email_re)?my_email_list[0].email.match(email_re)[0]:""; }
        return "";
    }
    var my_get_domain_only=function(the_url,lim_one) {
        var httpwww_re=/https?:\/\/www\./,http_re=/https?:\/\//,slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        console.log("ret="+ret);
        if(lim_one && /(co|ac|gov|com|org)\.([A-Za-z]{2})$/i.test(ret)) {
            console.log("* FOUND CO");
            ret=ret.replace(/^.*\.([^\.]+\.(?:co|ac|gov)\.[A-Za-z]{2})$/,"$1"); }
        //    else if(lim_one && /^[^\.]+\.[^\.]+(\.[a-z]{2}\.us)$/i) ret=ret;
        else if(lim_one) {
            console.log("* limone NOT FOUND CO");

            ret=ret.replace(/^.*\.([^\.]+\.[^\.]+$)/,"$1"); }
        return ret;
    }
    function init_Query() {
        var i;
        console.log("BEGIN: success="+success+", rate="+(success*100./(success+fail+0.)).toFixed(4)+"%");
        bad_urls=bad_urls.concat(default_bad_urls);
        var wT=document.querySelector("form table");
        my_query={name: wT.rows[0].cells[1].innerText, url: wT.rows[1].cells[1].innerText,found_fb:false,
                  email_list:[],pending_gov_promises:0,
                  fields:{email:""}, done:{url:false,info_query:false,query:true,fb:false},submitted: false};
        my_query.domain=MTP.get_domain_only(my_query.url,true);
       // if(!/https?:\/\/www\./.test(my_query.url)) my_query.url=my_query.url.replace(/(https?:\/\/)/,"$1www.");
        console.log("my_get_domain="+my_get_domain_only(my_query.url,true));
        var fb_promise;
        var ctrl=document.querySelectorAll(".form-control");
        ctrl.forEach(function(elem) { elem.required=false; });
        if(my_query.url.length>0) {
            call_contact_page(my_query.url,submit_if_done,'');
        }
        else {
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning info_query_search");
                query_search(my_query.name, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val);
                my_query.done.query=true;
                submit_if_done(); });
        }
       const infoqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning info_query_search");
            query_search("+\"info@"+my_query.domain+"\"", resolve, reject, query_response,"info_query");
        });
        infoqueryPromise.then(info_query_promise_then)
            .catch(function(val) {
            console.log("Failed at this fb_queryPromise " + val);
            my_query.done.info_query=true;
            submit_if_done(); });






    }


})();