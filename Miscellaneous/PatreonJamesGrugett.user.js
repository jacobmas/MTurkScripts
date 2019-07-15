// ==UserScript==
// @name         PatreonJamesGrugett
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
// @connect patreon.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=default_bad_urls.concat(["patreon.com","deviantart.com","vk.com",".tumblr.com","google.com","bandcamp.com"]);
    var MTurk=new MTurkScript(30000,200,[],begin_script,"A3K04IKASALO04",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
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
        if(my_query.email_list.length>0) {
            console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
            evaluate_emails();
       //     my_query.fields.email=my_query.email_list[0].email;
         //   my_query.fields.source=my_query.email_list[0].url;
        }

        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,is_done_dones=true,x;
        add_to_sheet();
        if(MTurk.doneQueries>=MTurk.queryList.length&&MTurk.doneQueries>0) my_query.done.url=true;
        console.log("my_query.done="+JSON.stringify(my_query.done));
        console.log("MTurk.doneQueries="+MTurk.doneQueries+", MTurk.queryList.length="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done&&MTurk.doneQueries>=MTurk.queryList.length;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length && !my_query.submitted && (my_query.submitted=true))
        {
            console.log("SUBMITTING");
            MTurk.check_and_submit();
        }
        else if(is_done_dones) {
            console.log("Done dones, returning");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
        else if(is_done && MTurk.doneQueries>=MTurk.queryList.length) {
            console.log("ALREADY SUBMITTED"); }
    }
    function parse_youtube_inner(text) {
            var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
        try { parsed=JSON.parse(text); }
        catch(error) { console.log("error parsing="+error+", text="+text); return; }
        tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
        try {
            for(i=0; i < tabs.length; i++) {
                if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
            }
        }
        catch(error) { console.log(error);
                     console.log(parsed);
                     }
        if(!content) return ret;
        contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
        if((label=contents.businessEmailLabel)===undefined) ret.email="";
        if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
           runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
        if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
        if((links=contents.primaryLinks)===undefined) links=[];
        for(i=0; i < links.length; i++) {
            url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
            console.log("url["+i+"]="+url);
            if(/instagram\.com/.test(url)) ret.insta=url;
            else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
            else if(/twitter\.com/.test(url)) ret.twitter=url;
            else if(!/plus\.google\.com|((youtube|gofundme|patreon)\.com)/.test(url) && i===0) ret.url=url;
        }
        if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
            if(match=ret.description.match(email_re)) ret.email=match[0];
            if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
            if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
        }
        if(contents.businessEmailLabel===undefined) ret.businessEmailLabel=false;
        else ret.businessEmailLabel=true;
        return ret;
    }


    function parse_youtube(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,script_regex_begin=/^\s*window\[\"ytInitialData\"\] \=\s*/,text;
        var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret=null,x,promise_list=[];
        var email_match,match;
        for(i=0; i < scripts.length; i++) {
            if(script_regex_begin.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(script_regex_begin,"");
                console.log(text.indexOf(";"));
                if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
                ret=parse_youtube_inner(text);
                if(!ret) {
                    my_query.done.youtube=true;
                    submit_if_done();
                    return;
                }
                break;
            }
        }
        if(!ret) {
            my_query.done.youtube=true;
            submit_if_done();
            return; }
        console.log("YOUTUBE ret="+JSON.stringify(ret));
        if(ret&&ret.description && (email_match=ret.description.match(email_re)) &&

           (my_query.fields.source=url)&&
           (my_query.fields.email=email_match[0])) submit_if_done();
        else { console.log("email_match="+email_match); }
        if(ret.description) {
            if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
            if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
        }
        //console.log("ret="+JSON.stringify(ret));
        console.log("my_query="+JSON.stringify(my_query));


        if(ret.fb && !my_query.found_fb && (my_query.found_fb=true) && (my_query.fb_about_url=ret.fb)) {
            my_query.done.fb=false;
            promise_list.push(MTurkScript.prototype.create_promise(ret.fb,MTurkScript.prototype.parse_FB_about,parse_fb_about_then));
        }
        //else if(my_query.done.fb=true) submit_if_done();
        if(ret.url && (ret.url=ret.url.replace(/^www/,"http://www")) && my_query.fields.email.length===0 && !MTP.is_bad_url(ret.url,bad_urls,-1)) {
            
            my_query.done.url=false;
            call_contact_page(ret.url,submit_if_done);
        }
        else { my_query.done["web"]=true; submit_if_done(); }
        my_query.done.youtube=true;
        if(my_query.done.fb===undefined && my_query.url.length===0) my_query.done.url=true;
        submit_if_done();

    }

    function parse_insta_then(result) {
        var match;
        console.log("insta_result: "+JSON.stringify(result));
        if(result.success && result.email) { my_query.fields.email=result.email; }
        if(result.biography && (match=result.biography.match(email_re))) my_query.fields.email=match[0];
        my_query.done.insta=true;
        submit_if_done();

    }

    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='' || extension==='info') {
            extension=extension==='info'?extension:'';
            MTurk.queryList.push(url); }
        console.log("MOO");
        GM_xmlhttpRequest({method: 'GET', timeout:15000,url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                        if(extension==='' && !/https?:\/\/www\./.test(url)) {
                                                            call_contact_page(url.replace(/(https?:\/\/)/,"$1www."));
                                                            return; }

                                                        // if(extension==='') my_query.fields.email="none@none.com";
                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    };

    var my_cfDecodeEmail=function(encodedString) {
        console.log("my_cfDecodeEmail");
        var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
        if(encodedString) {
            console.log("encodedString="+encodedString+", r="+r+" encodedString.length="+encodedString.length); }
        for (n = 2; n<encodedString.length; n += 2){
            i = parseInt(encodedString.substr(n, 2), 16) ^ r;
            console.log("i="+i);
            email += String.fromCharCode(i);
        }
        return email;
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
        MTP.fix_emails(doc,url);
        console.log("in contact_response "+url+", extension="+extension);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|People|Terms|Kontakt|Conta|Contatto)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        var url_contact_regex=/contact|kontakt/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*[\s\(\[]{1}at[\s\)\]]{1}\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            if(extension==='info') email_matches=email_matches.filter(filter_by_domain);
            for(j=0;j<email_matches.length;j++) {
                if(!MTP.is_bad_email(email_matches[j])) my_query.email_list.push({email:email_matches[j],url:url});
            }

            console.log("Found email hop=");
        }
        if((phone_matches=doc.body.innerText.match(phone_re)) &&
           (my_query.fields.phoneNumber===undefined || my_query.fields.phoneNumber.length===0) ) my_query.fields.phoneNumber=phone_matches[0];
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
            if(/^tel:/.test(links[i].href) &&  (my_query.fields.phoneNumber===undefined || my_query.fields.phoneNumber.length===0)) {
                my_query.fields.phoneNumber=links[i].href.replace(/^tel:\s*/,""); }
            try {
                if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
                   !MTurkScript.prototype.is_bad_email(temp_email[0])) {
                    console.log("Found good email "+temp_email[0]);
                    my_query.email_list.push({email:temp_email[0],url:url});
                }
            }
            catch(error) { console.log("error="+error+", links["+i+"]="+links[i].outerHTML+", temp_email="+temp_email); }
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
        callback();
        return;
    };
    function remove_dups(lst) {
        for(var i=lst.length;i>0;i--) if(lst[i]===lst[i-1]) lst.splice(i,1);
    }

    function evaluate_emails() {
      //  console.log("name="+JSON.stringify(my_query.fullname));
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];

        my_query.email_list.sort(function(x,y) {
            var a=x.email,b=y.email;
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
        function EmailQual(email,url,quality) {
            var x,i;
            if(quality===undefined) quality=0;
            this.email=email.replace(/(\.(com|org|edu|net)).*$/,"$1");
            this.nicknames={"Ronald":["Ron"],"Michael":["Mike"],"Robert":["Bob","Bobby","Rob"],"Patricia":["Pat","Tricia"],"Sandra":["Sandy"]};
            var reg=/^.*\u0007(.*@.*)$/;
            //  console.log("### reg="+reg.source);
            this.email=email.replace(reg,"$1");
            this.url=url;
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=quality;
            var email_begin=email.replace(/@[^@]*$/,"");
            if(this.quality===0) {
                if(new RegExp(my_query.fullname.fname,"i").test(email_begin)) this.quality=1;
                if(this.nicknames[my_query.fullname.fname]!==undefined) {
                    for(i=0;i<this.nicknames[my_query.fullname.fname].length;i++) {
                        if(new RegExp(this.nicknames[my_query.fullname.fname][i],"i").test(email_begin)) this.quality=1;
                    }
                }
                if(new RegExp(my_query.fullname.lname.substr(0,4)+"$","i").test(email_begin)) this.quality=1.5;
                if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email_begin)) {
                    this.quality=2;
                    if(email_begin.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                       my_query.fullname.fname.toLowerCase().charAt(0)===email_begin.toLowerCase().charAt(0)) this.quality=3;
                }
                if(email_begin.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email_begin.toLowerCase().charAt(0)) this.quality=3;
                for(i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email_begin)) this.quality=4;
                if(this.domain===my_query.domain&&this.quality>0) this.quality+=4;
                if(this.email.toLowerCase().indexOf(my_query.fields.name.replace(/\s/g,"").toLowerCase())!==-1) this.quality+=5;
                if(/^(contact|info)/.test(this.email)) this.quality=0;
            }
        }
        EmailQual.prototype.toString=function() {
            return "email="+this.email+", quality="+this.quality; };
        for(i=0;i<my_query.email_list.length;i++) {
            // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(MTP.is_bad_email(my_query.email_list[i].email)) continue;
            curremail=new EmailQual(my_query.email_list[i].email.trim(),my_query.email_list[i].url.trim(),my_query.email_list[i].quality);
            if(curremail.quality>=0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return b.quality-a.quality; });
        for(i=0;i<my_email_list.length;i++) {
            console.log("my_email_list["+i+"]="+my_email_list[i].toString()); }
        if(my_email_list.length>0) {
            my_query.fields.email=my_email_list[0].email;
            my_query.fields.source=my_email_list[0].url;
            return "";
        }
        return "";
    }

    function parse_fb_about_then(result) {
        console.log("PARSE_FB_ABOUT: result="+JSON.stringify(result));
        if(result.email) {
            my_query.email_list.push({email:result.email,url:my_query.fb_about_url,quality:10});

            my_query.fields.email=result.email; my_query.done.fb=true;
                         my_query.fields.source=my_query.fb_about_url;
                         }
        if(result.url&&!MTP.is_bad_url(result.url.toLowerCase(),bad_urls,-1) && result.url.length>0 && (!my_query.url||my_query.url.length===0)) my_query.url=result.url;
        my_query.done.fb=true;

        if(my_query.fields.email.length===0&&my_query.url&&my_query.url.length>0) {
            console.log("Found url");
            my_query.done.url=false;
            call_contact_page(my_query.url,submit_if_done,'');
            return;
        }
        else {
            my_query.done.url=true; }

        submit_if_done();

    }

    function parse_patreon_creator(creator) {
        var result={facebook:"",twitter:"",url:"",youtube:"",first_name:"",last_name:"",full_name:""};
        var included=creator.included,i,x;
        result.summary=creator.data.attributes.summary;
        for(i=0;i<included.length&&i<1;i++) {
            for(x in result) if(included[i].attributes[x]) result[x]=included[i].attributes[x];
        }
        return result;
    }

    function parse_patreon(doc,url,resolve,reject) {
        console.log("In parser_patreon, url="+url);
        var i,scripts=doc.scripts,match,parsed,result;
        var summary=doc.querySelector(".oxmkdz-0.DICHK div");

        var regex=/Object\.assign\(window\.patreon\.bootstrap, (\{[^]*?\})\);/;
        for(i=0;i<scripts.length;i++) {
            if((match=scripts[i].innerHTML.match(regex))) {
                try {
                    parsed=JSON.parse(match[1]);
                    result=parse_patreon_creator(parsed.creator);
                    console.log("Successful parse!");
                }
                catch(error) { console.log("Error in parsing JSON "+error); }
            }
        }
        result.links=[];
        if(summary) {
            var a=summary.querySelectorAll("a");
            for(i=0;i<a.length;i++) {
                a[i].href=a[i].href.replace(/\/$/,"");
                if(!MTP.is_bad_url(a[i].href,bad_urls,3)) result.links.push(a[i].href);
            }
        }
        resolve(result);
    }

    function parse_youtube_then(result) {
    }

    function parse_patreon_then(result) {
        console.log("PATREON result="+JSON.stringify(result));
        var email_matches,j,i;
        console.log("result.links="+JSON.stringify(result.links));

        for(i=0;i<result.links.length;i++) {
            console.log("Calling call_contact_page on "+result.links[i]);
            call_contact_page(result.links[i],submit_if_done,'');
        }
        //console.log("Blunk");
        if(result.summary && (email_matches=result.summary.match(email_re))) {
            for(j=0;j<email_matches.length;j++) {
                if(!MTP.is_bad_email(email_matches[j])) my_query.email_list.push({email:email_matches[j],url:my_query.patreon,quality:10});
            }
        }
        if(result.first_name) {
            var nlp_out=nlp(result.full_name).people().out('topk');
            console.log("nlp_out="+JSON.stringify(nlp_out));
            if(nlp_out.length>0) my_query.fields.name=result.first_name;

            else my_query.fields.name=result.full_name;
            my_query.fullname.fname=result.first_name;
        }
        if(result.last_name) { my_query.fullname.lname=result.last_name; }

        my_query.done.patreon=true;
        result.facebook=result.facebook.replace(/facebook\.com\/pages\/([^\/]*)\/([^\/]*).*$/,"facebook.com/$1-$2");

        if((my_query.fb_url=result.facebook) && my_query.fb_url.length>0 && !MTP.is_bad_fb(my_query.fb_url))
        {
            my_query.done.fb=false;
            my_query.found_fb=true;
            my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
            console.log("my_query.fb_about_url="+my_query.fb_about_url);
            var fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
        }
        if(result.youtube) {
            my_query.done.youtube=false;
            my_query.youtube=result.youtube+"/about";
            var promise=MTurkScript.prototype.create_promise(my_query.youtube,parse_youtube,parse_youtube_then);
        }
        else { my_query.done.youtube=true; }
        if(!result.youtube && !result.facebook) my_query.done.url=true;
        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var url=document.querySelectorAll("form strong");
        console.log("url="+JSON.stringify(url));
        my_query={fullname:{fname:"",lname:""},patreon:url[2].innerText,url:"",fields:{email:"",source:"",name:""},email_list:[],
                  found_fb:false,done:{"patreon":false,"url":false,"youtube":false},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        console.log("MOO "+my_query.patreon);

        var promise=MTP.create_promise(my_query.patreon,parse_patreon,parse_patreon_then);
                console.log("TOO");

        /*var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,type);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();