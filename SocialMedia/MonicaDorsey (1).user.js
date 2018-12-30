// ==UserScript==
// @name         MonicaDorsey
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  New script "Any worker with 3 inaccurate emails" Fixed up
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
// @grant  GM_getValue
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(30000,200,[],begin_script,"A3H71S74T2IQ5Q");
    var MTP=MTurkScript.prototype;
    function check_function()
    {
        return true;
    }

    function is_bad_email(email)
    {
        if(email.indexOf("@example.com")!==-1 || email.indexOf("@email.com")!==-1 || email.indexOf("@domain.com")!==-1) return true;
        return false;
    }

    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function is_bad_name(b_name)
    {
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase().split(" ")[0])===-1) return true;
	return false;
    }

    function query_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in email_response");
        var email_match=doc.body.innerText.match(email_re);
        if(email_match!==null )
        {

             if(!is_bad_email(email_match[0]) && !my_query.submitted)
             {
                 my_query.submitted=true;
                document.getElementById("email").value=email_match[0];

                check_and_submit(check_function,automate);
                return;
             }
        }
//        GM_setValue("returnHit",true);
        return;

    }


    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function fb_promise_then(url) {
        my_query.fb_url=url;
        my_query.fb_url=my_query.fb_url.replace(/(https?:\/\/[^\/]*\/[^\/]*).*$/,"$1/about/?ref=page_internal")
        console.log("my_query.fb_url="+my_query.fb_url);
        GM_setValue("fb_url",my_query.fb_url);
    }

    function add_to_sheet() {
        var field_name_map={"email":"Email","url":"ContactInfoPage"};
        var x,field,match;
        if(my_query.fields.email&&my_query.fields.email.length>0)  {
            console.log("*** my_query.fields.email="+my_query.fields.email);
            my_query.fields.email=my_query.fields.email.toString().replace(/^20([a-z]+)/,"$1"); }
        if(my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            my_query.fields["first name"]=match[1];
            my_query.fields["last name"]=match[2];
        }
        for(x in my_query.fields) {
            if(document.getElementById(x) && my_query.fields[x].length>0) {
                document.getElementById(x).value=my_query.fields[x];

            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done["url"]=true; }
        console.log("my_query="+JSON.stringify(my_query)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length===0) {
                console.log("no email found, returning");
                GM_setValue("returnHit",true);
                return;
            }
            MTurk.check_and_submit(); }
    }
    /* Call contact_page works with contact_response */
    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                        if(extension==='') my_query.fields.email="none@none.com";
                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    };


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        var begin_email=my_query.fields.email;
        if(extension===undefined) extension='';

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Coach)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {


             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            if(/instagram\.com/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
            if(my_query.fb_url.length===0 && /facebook\.com/.test(links[i].href)) {
                my_query.done["fb"]=false;
                my_query.fb_url=links[i].href;
                console.log("FOUND FB");
                my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
                    .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
                console.log("my_query.fb_about_url="+my_query.fb_about_url);
                var  fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
            }

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        callback();
        return;
    };

  function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback==undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
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
        if(result.email) { my_query.fields.email=result.email; my_query.done.fb=true; my_query.done.url=true; }
        if(result.url&&result.url.length>0 && my_query.url.length===0) my_query.url=result.url;
        my_query.done.fb=true;
        submit_if_done();
        if(my_query.fields.email.length===0&&my_query.url.length>0 && !my_query.done.url) {
            call_contact_page(my_query.url,submit_if_done,'');
            return;
        }
        else if(my_query.fields.email.length===0) {
            //my_query.fields.email="none@none.com";
            my_query.done.url=true;
            submit_if_done();

            return;
        }
    }

    function init_Query() {

        var i;
       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        my_query={name: wT.rows[0].cells[1].innerText, url: wT.rows[1].cells[1].innerText,
                  fb_url: wT.rows[2].cells[1].innerText, contact:wT.rows[3].cells[1].innerText,
                  fields:{email:""}, done:{fb:false,url:false},submitted: false};
        var temp_url;
        if(/facebook\.com/.test(my_query.url) && !/facebook\.com/.test(my_query.fb_url)) {
            temp_url=my_query.url;
            my_query.url=my_query.fb_url;
            my_query.fb_url=temp_url; }

        my_query.url=!/https?:\/\/www/.test(my_query.url) && !/^www/.test(my_query.url) ? "http://www."+my_query.url
        : my_query.url;
        if(!/https?:\/\//.test(my_query.url)) my_query.url="https://"+my_query.url;
        var fb_promise;
        my_query.fb_url=my_query.fb_url.replace(/\/pages\/([^\/]+)\/([^\/]+).*$/,"/$1-$2/");
        console.log("my_query="+JSON.stringify(my_query));


      
        if(my_query.fb_url.length>0 && !is_bad_fb_url(my_query.fb_url))
        {
            my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
            console.log("my_query.fb_about_url="+my_query.fb_about_url);
            fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
        }
        else
        {
            my_query.done.fb=true;
            if(my_query.fields.email.length===0&&my_query.url.length>0) {
            call_contact_page(my_query.url,submit_if_done,'');
            return;
        }
        }






    }


})();