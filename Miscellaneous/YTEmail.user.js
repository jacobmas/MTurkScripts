// ==UserScript==
// @name         YTEmail
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Youtube email
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.facebook.com/*
// @include https://twitter.com/*
// @include https://*.twitter.com/*

// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_deleteValue
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/discord.gg","/paypal.me",".beatstars.com","twitch.tv","/goo.gl","/amzn.to/","/ask.fm/",
                 "/soundcloud.com","/dlive.tv",".buymeacoffee.com/","/linktr.ee/"];
    var MTurk=new MTurkScript(100000,750+(500*Math.random()),[],begin_script,"A2PC0RNPQLZREF",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name) {
        return false;
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

    if(/\.facebook\.com/.test(window.location.href)) {
        GM_addValueChangeListener("facebook",function() {
            console.log("arguments=",arguments);
            window.location.href=arguments[2].url;
        });
        console.log("MOOO");

        setTimeout(parse_FB,1500);

    }
        if(/\/twitter\.com/.test(window.location.href)) {
        GM_addValueChangeListener("twitter",function() {
            console.log("arguments=",arguments);
            window.location.href=arguments[2].url;
        });
        console.log("MOOO");

        setTimeout(parse_twitter,1500);

    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
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
    const TWITTER_API_AUTHORIZATION_HEADER = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
    const Twitter_globalGuestTokenManager = {};
    const Twitter_GUEST_TOKEN_VALIDITY = 10800;
    const Twitter_user_base='https://twitter.com/i/user/';
    const Twitter_user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36';


    /* Parse twitter in browser */
    function parse_twitter() {

        var ret={};
        var desc=document.querySelector("[data-testid='UserDescription']");
        if(desc) {
            ret.description=desc.innerText.trim();
            let email;
            if((email=ret.description.match(email_re))) {
                ret.email=email[0];
            }
        }
        ret.date=Date.now();

        let userurl=document.querySelector("[data-testid='UserUrl'] span");
        if(userurl) {
            ret.url="https://"+userurl.innerText.trim();
        }
        console.log("In AggParser.parse_twitter");
        GM_setValue("twitter_result",ret);

    }

    AggParser.is_bad_linked_url = function(url) {
        if(/((youtube|gofundme|discord|vk|spotify|patreon|tiktok|roblox|snapchat|bigcartel|pinterest)\.com)/.test(url)) return true;
        if(/plus\.google\.com|paypal\.me|twitch\.tv|linkin\.bio|\.apple\.com|teepublic\.com|\/shop\//.test(url)) return true;
        if(/((\.myspreadshop|\.teespring)\.com|\.roku\.com)/.test(url)) return true;

        return false;
    }

    AggParser.parse_youtube_runs = function(runs,ret) {
        var run,email;
        for(run of runs) {
            console.log("run=",run.text);
            if((email=run.text.match(email_re))&&!ret.email) {
                ret.email=email[0];
            }
        }
        return ret;
    };

    /* parse_youtube_inner is a helper function for the parse_youtube function */
    AggParser.parse_youtube_inner=function(text,page) {
        console.log("parse_youtube_inner, page=",page);
        var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
        var subscribers,match1,match2;
        try { parsed=JSON.parse(text); }
        catch(error) { console.log("error parsing="+error+", text="+text); return; }
        for(x in parsed) {
            //   console.log("x="+x);

            if(/subscriber/.test(JSON.stringify(parsed[x]))) console.log("found subscriber");
        }
        console.log("parsed=",parsed);
     //   console.log("header=",parsed.header);
        try {

            subscribers=parsed.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText.replace(/\s.*$/,"").trim().replace(/^[^\d]*/,"");
            //   console.log("subscribers=",subscribers);
            match1=subscribers.match(/([\d\.]+)([a-zA-Z]*)/);
            //  console.log(match1);
            if(match1) {
                let temp1=parseFloat(match1[1]);
                if(match1[2]==='K') temp1*=1000;
                if(match1[2]==='M') temp1*=1000000;
                ret.subscribers=temp1;
            }
        }
        catch(e) { console.warn("Error parsing subscribers"); }
       // console.log("contents=",parsed.contents);
        if(!parsed.contents) {
            ret.email='none@none.none';
            return ret;
        }
        tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
        for(i=0; i < tabs.length; i++) if(tabs[i].tabRenderer && tabs[i].tabRenderer.title===page && (content=tabs[i].tabRenderer.content)) break;
        if(!content) return ret;

        if(page==="About") {
            contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
            if((label=contents.businessEmailLabel)===undefined) ret.email="";
            if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
               runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
            if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
            if((links=contents.primaryLinks)===undefined) links=[];
            if(contents.title) ret.name=contents.title.simpleText;
            for(i=0; i < links.length; i++) {
                url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
                console.log("url["+i+"]="+url);
                if(/instagram\.com/.test(url)) ret.insta=url;
                else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
                else if(/twitter\.com/.test(url)) ret.twitter=url;
                else if(/plus\.google\.com/.test(url)) ret.googleplus=url;
                else if(!AggParser.is_bad_linked_url(url) && !MTP.is_bad_url(url,bad_urls,4,2)&&!ret.url) {
                    ret.url=url;
                    if(/^www/.test(ret.url)) ret.url="https://"+ret.url;
                    if(!/^http/.test(ret.url)) ret.url="https://www."+ret.url;
                }
                let temp_match;
                if(!/http/.test(url) && (temp_match=url.match(email_re))) ret.email=temp_match[0];
            }
            if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
                if(match=ret.description.match(email_re)) ret.email=match[0];
                if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
                if(ret.insta && /^www/.test(ret.insta)) ret.insta="https://"+ret.insta;
                if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
            }
        }
        else if(page==="Home") {
            console.log("content=",content);
            try {
                let runs = content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelVideoPlayerRenderer.description.runs;
                console.log("runs=",runs);
                ret = AggParser.parse_youtube_runs(runs, ret);
            }
            catch(e) { console.warn("Error parsing home",e); }
        }
        return ret;
    };
    /* parse_youtube Parses the 'about' page of a youtube channel */
    AggParser.parse_youtube=function(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,script_regex_begin=/^\s*var ytInitialData \=\s*/,text;
        var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret={success:false},x,promise_list=[];
        var email_match,match;
        for(i=0; i < scripts.length; i++) {
           // console.log("scripts[i]=",scripts[i].innerHTML);
            if(script_regex_begin.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(script_regex_begin,"");

                if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
                ret=AggParser.parse_youtube_inner(text,"About");
                console.log("ret=",ret);
                resolve(ret);
                return;
            }
        }
        resolve(ret);
    };

     AggParser.parse_youtube_home=function(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,script_regex_begin=/^\s*var ytInitialData \=\s*/,text;
        var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret={success:false},x,promise_list=[];
        var email_match,match;
        for(i=0; i < scripts.length; i++) {
           // console.log("scripts[i]=",scripts[i].innerHTML);
            if(script_regex_begin.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(script_regex_begin,"");

                if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
                ret=AggParser.parse_youtube_inner(text,"Home");
                console.log("ret=",ret);
                resolve(ret);
                return;
            }
        }
        resolve(ret);
    };

    function parse_insta_then(result) {
        var match;
        console.log("insta_result: "+JSON.stringify(result));
        if(result.success && result.email) {


            my_query.fields.email=result.email.replace(/^[^@]*[^0-9A-Za-z\.\_]+/,""); }
        if(result.biography && (match=result.biography.match(email_re))) {
            console.log("match=",match);
            my_query.fields.email = match[0].trim();
        }
        if(!my_query.found_web.youtube && !my_query.found_web.fb && !my_query.found_web.twitter && result.url &&
           !MTP.is_bad_url(result.url,bad_urls,4,2) &&
           !AggParser.is_bad_linked_url(result.url)) {
            my_query.done.web=false;
            my_query.found_web.insta=true;
            let promise=MTP.create_promise(result.url, Gov.init_Gov,gov_then,function() { console.log("Done web, ",my_query.done);
                my_query.done.web=true; submit_if_done(); },{dept_regex_lst:[/Privacy/],title_regex_lst:[/Owner/,/Manager/]});
        }
        my_query.done.insta=true;
        submit_if_done();

    }
    function parse_fb_then(result) {
        console.log("fb_result: "+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; }
        console.log("!my_query.found_web.youtube && !my_query.found_web.insta=",(!my_query.found_web.youtube && !my_query.found_web.insta));

        my_query.done["fb"]=true;
        submit_if_done();

    }

     function parse_youtube_home_then(result) {
         console.log("parse_youtube_home_then,result=",result);
         if(result.email && !my_query.fields.email) {
            my_query.fields.email=result.email;
         }
         my_query.done.youtube_home=true;
         submit_if_done();
     }
    function parse_youtube_then(result) {
        console.log("youtube_then,result=",result);
        console.log("description = ",result.description);
        if(result.email) {
            my_query.fields.email=result.email;
            var d;
            for(d in my_query.done) {
                my_query.done[d]=true;
            }
            my_query.done.youtube_home=false;
            my_query.found_fb=true;
            my_query.found_web.youtube=true;
            submit_if_done();
            return;
        }
        if(result.url) {
            result.url=result.url.replace(/^(https?:\/\/[^\/]*).*$/,"$1");
            my_query.found_web.youtube=true;
            let promise=MTP.create_promise(result.url, Gov.init_Gov,gov_then,function() { console.log("Done web, ",my_query.done);
                my_query.done.web=true; submit_if_done(); },{dept_regex_lst:[/Privacy/,/Policies/],title_regex_lst:[/Owner/,/Manager/]});
        }
        else {
            my_query.done.web=true;
        }
        if(result.fb) {
            my_query.found_fb=true;
            GM_addValueChangeListener("fb_result",function() {
                console.log("fb_result,arguments=",arguments[2]);
                result=arguments[2];
                if(result.email) {
                    my_query.fields.email=result.email;
                }
                if(!my_query.fields.email && !my_query.found_web.youtube && !my_query.found_web.insta && !my_query.found_web.twitter && result.url &&
                   !MTP.is_bad_url(result.url,bad_urls,4,2) &&
                   !AggParser.is_bad_linked_url(result.url)) {
                    my_query.done.web=false;
                    my_query.found_web.fb=true;
                    let promise=MTP.create_promise(result.url, Gov.init_Gov,gov_then,function() { console.log("Done web, ",my_query.done);
                                                                                                 my_query.done.web=true; submit_if_done(); },{dept_regex_lst:[/Privacy/],title_regex_lst:[/Owner/,/Manager/]});
                }
                my_query.done.fb=true;
                submit_if_done();
            });
            GM_setValue("facebook",{url:result.fb,date:Date.now()});
        }
        else {
                            my_query.done.fb=true;
                submit_if_done();
        }
        if(result.insta) {
            var promise=MTP.create_promise(result.insta,AggParser.parse_instagram,parse_insta_then,function() {
                my_query.done.insta=true;
            submit_if_done();
            });
        }
        else {
            my_query.done.insta=true;
            submit_if_done();
        }
        if(result.twitter) {
            console.log("Setting twitter result");
             GM_addValueChangeListener("twitter_result",function() {
                console.log("twitter_result,arguments=",arguments[2]);
                result=arguments[2];
                if(result.email) {
                    my_query.fields.email=result.email;
                }
                if(!my_query.fields.email && !my_query.found_web.youtube && !my_query.found_web.insta && !my_query.found_web.fb && result.url &&
                   !MTP.is_bad_url(result.url,bad_urls,4,2) &&

                   !AggParser.is_bad_linked_url(result.url)) {
                    my_query.done.web=false;
                    my_query.found_web.twitter=true;
                    let promise=MTP.create_promise(result.url, Gov.init_Gov,gov_then,function() { console.log("Done web, ",my_query.done);
                                                                                                 my_query.done.web=true; submit_if_done(); },{dept_regex_lst:[/Privacy/],title_regex_lst:[/Owner/,/Manager/]});
                }
                my_query.done.twitter=true;
                submit_if_done();
            });
            GM_setValue("twitter",{url:result.twitter,date:Date.now()});


        }
        else {
            my_query.done.twitter=true;
            submit_if_done();
        }
    }


    function parse_twitter_then(result) {
                    my_query.done.twitter=true;
            submit_if_done();
        }


    function gov_then(result) {
        console.log("Gov=",Gov);
        console.log("Gov_then, email_list=",Gov.email_list);
        if(!my_query.fields.email && Gov.email_list.length>0) {
            my_query.fields.email=Gov.email_list[0].email;
        }
        if(!my_query.found_fb && Gov.fb_url) {
            my_query.found_fb=true;
            my_query.done.fb=false;
            GM_addValueChangeListener("fb_result",function() {
                console.log("fb_result,arguments=",arguments[2]);
                result=arguments[2];
                if(result.email) {
                    my_query.fields.email=result.email;
                }

                my_query.done.fb=true;
                submit_if_done();
            });
            GM_setValue("facebook",{url:Gov.fb_url,date:Date.now()});
        }
        my_query.done.web=true;
        submit_if_done();
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function parse_FB() {
        console.log("parse FB");
        var result={};
        let email=document.querySelector("a[href^='mailto:']");
        if(email) {
            result.email=email.href.replace(/^\s*mailto:\s*/,"");
        }
        else {
            let temp_emails=document.querySelectorAll(".j83agx80 > .qzhwtbm6.knvmm38d > .d2edcug0.b1v8xokw.a3bd9o3v.jq4qci2q.iv3no6db");
            let temp_email,match;
            for(temp_email of temp_emails) {
                if(temp_email && /a/.test(temp_email.innerText) && (match=temp_email.innerText.match(email_re))) {
                    result.email=temp_email.innerText.trim();
                    break;
                }
            }
        }
        result.address=document.querySelector("a[href*='google.com']")?document.querySelector("a[href*='google.com']").innerText.trim():"";

        var good_fields=document.querySelectorAll(".rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.o8rfisnq.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt");
        var curr_field;
        for(curr_field of good_fields) {
            if(/Follow This/i.test(curr_field.innerText)) {
                result.followers=curr_field.innerText.trim().replace(/^([\d,]*).*$/,"$1").replace(/,/g,"");
            }
            if(phone_re.test(curr_field.innerText)) {
                result.phone=curr_field.innerText.trim();
            }

        }

        var url=document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']")?document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']"):"";
        result.url=url?url.href:"";
        result.url=decodeURIComponent(result.url.replace("https://l.facebook.com/l.php?u=","")).replace(/\?fbclid\=.*$/,"");
        console.log("result=",result);
        result.date=Date.now();
        GM_setValue("fb_result",result);

    }

     function add_to_sheet() {
        var x,field;
                 if(my_query.fields.email) my_query.fields.email=my_query.fields.email.replace(/\?.*$/,"").replace(/[^A-Za-z_\=\+\-0-9;:@#!%$\.\[\]]+/,"");

        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        console.log("my_query.done=",my_query.done);
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function call_contact_page(url,callback,extension) {
        if(extension===undefined) { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");

                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    }


    /**
     * contact_response Here it searches for an email */
    function contact_response(doc,url,extra) {
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        if(extension===undefined) extension='';
        console.log("in contact_response "+url);
        MTP.fix_emails(doc,url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Privacy|Legal|Contato|Kontakt)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurkScript.prototype.is_bad_email(email_matches[j]) && email_matches[j].length>0 && my_query.fields.email.length===0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(my_query.fields.email==="jacobmas@gmail.com") my_query.fields.email="";

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {

            if(my_query.fields.email.length>0) break;
            // console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email) && my_query.fields.email.length===0) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
              (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)&& my_query.fields.email.length===0) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            if(my_query.fields.email==="jacobmas@gmail.com") my_query.fields.email="";
        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        callback();
        return;
    }


    function init_Query() {
        console.log("in init_query");
        bad_urls=bad_urls.concat(default_bad_urls);

        var i;
       // var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var a = document.querySelector("crowd-form a").href;
        my_query={url:a+"/about",fields:{email:""},submitted:false,done:{"insta":false,"fb":false,"web":false,"twitter":false,"youtube_home":false},
                  found_web:{"youtube":false,"insta":false,"fb":false},
                  found_fb:false,
                 url_list:[]};
        console.log("my_query=",my_query);
        var promise=MTurkScript.prototype.create_promise(my_query.url,AggParser.parse_youtube,parse_youtube_then);
        var promise2=MTurkScript.prototype.create_promise(a,AggParser.parse_youtube_home,parse_youtube_home_then);
        var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            //   query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
                         )
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();