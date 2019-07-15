// ==UserScript==
// @name         RoweDigital
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Clone of ChrisRichmond
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
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css

// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/app.lead411.com",".zoominfo.com",".privateschoolreview.com",".facebook.com",".niche.com","en.wikipedia.org",".yelp.com","hunter.io",
                 ".zoominfo.com","issuu.com","linkedin.com"];
    var MTurk=new MTurkScript(60000,750+Math.random()*1000,[],begin_script,"A3Q0BY805HR617",false);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    var Email=function(email,value) {
        this.email=email;
        this.value=value;
    };
    /* A pretty good form of is_bad_name */
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        return true;
    }

    function is_bad_fb(b_url,b_name) {
        if(/\/(pages|groups|search|events)\//.test(b_url)) return true;
        return false;
    }
    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.done.query=true;
        console.log("Found url="+result+", calling");
        my_query.url=result;

        call_contact_page(result,submit_if_done);
    }

    function fb_promise_then(result) {
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields.first=fullname.fname;
        }
        if(result.email) {
            my_query.email_list.push(result.email);
            evaluate_emails(submit_if_done);
           /* if(!(my_query.fields.email.length>0 && /info@/.test(result.email))) {
                my_query.fields.email=result.email; }*/
            my_query.done.url=true;
        }
        else {
            if(result.url && !MTP.is_bad_url(result.url,bad_urls,-1)) query_promise_then(result.url);
            else
            {

            }
            console.log("Calling submit_if_done from parse_fb_about_then");
            submit_if_done();
        }
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
        var field_name_map={"email":"Email ","first":"First Name"};
        var x,field,match,nlp_match,nlp_out;
        if(my_query.fields.email&&my_query.fields.email.length>0)  {
            console.log("*** my_query.fields.email="+my_query.fields.email);
            my_query.fields.email=my_query.fields.email.toString().replace(/^20([a-z]+)/,"$1"); }
        if(my_query.fields.first.length===1 && my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            nlp_out=nlp(match[1]+" "+match[2]).people().out('topk');
            console.log("nlp_out="+JSON.stringify(nlp_out));
            if(nlp_out.length>0) {
                my_query.fields.first=match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
            }
        }
        else if(my_query.fields.first.length===1 && my_query.fields.email.length>0 && (nlp_match=my_query.fields.email.match(/([^@]+)@/))) {
            console.log("nlp_match="+nlp_match);
            if(nlp(nlp_match[1]).people().out('topk').length>0) {
                my_query.fields.first=nlp_match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); }); }
        }
        my_query.fields.first=my_query.fields.first.replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
         console.log("my_query.person_list="+JSON.stringify(my_query.person_list));
        if(my_query.person_list.length>0&&my_query.person_list[0].quality>=2) {

            let fullname=MTP.parse_name(my_query.person_list[0].name);
            my_query.fields.first=fullname.fname;
            my_query.fields.email=my_query.person_list[0].email;
        }
        if(my_query.fields.email.length===0 && my_query.form_list.length>0) {
            my_query.fields.email=my_query.form_list[0];
        }


        for(x in my_query.fields) {
            if((field=document.getElementsByName(field_name_map[x])).length>0) {
                field[0].value=my_query.fields[x];
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true; }
        if(my_query.done.url && !my_query.found_fb) my_query.done.fb=true;
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length>0) MTurk.check_and_submit();
            else {
                console.log("Insufficient info found, returning");
                GM_setValue("returnHit"+MTurk.assignment_id,true);
                return;
            }
        }
    }

    /* Do the nlp part */
    var do_nlp=function(text,url) {
        var nlp_temp,j,k,i;
        //console.log("text="+text);
        var text_split=text.split(/(\s+[–\-\|]+|,)\s+/);
        for(i=0;i<text_split.length;i++) {
            if(/(^|[^A-Za-z]+)(Blog)($|[^A-Za-z]+)/i.test(text_split)) continue;
            nlp_temp=nlp(text_split[i]).people().out("terms");
            console.log("out="+JSON.stringify(nlp_temp));
            if(nlp_temp.length===2 && nlp_temp[0].tags.includes("FirstName") && nlp_temp[nlp_temp.length-1].tags.includes("LastName") &&
              !nlp_temp[nlp_temp.length-1].tags.includes("Comma") && !nlp_temp[nlp_temp.length-1].tags.includes("ClauseEnd")
              && !nlp_temp[0].tags.includes("Possessive") && !nlp_temp[nlp_temp.length-1].tags.includes("Possessive") &&
               nlp_temp[nlp_temp.length-1].text.toLowerCase()===nlp_temp[nlp_temp.length-1].normal.toLowerCase() &&
               nlp_temp[nlp_temp.length-1].normal!=="park" && !nlp_temp[0].tags.includes("ClauseEnd") &&
               !/(ing$)|academy|location|street|schools|christian|high/.test(nlp_temp[nlp_temp.length-1].normal)
               &&!/location|street|christian|high|west|east|north|south|dallas|trenton/.test(nlp_temp[0].normal)
              ) {
                my_query.fields.first=nlp_temp[0].text;
                return;
            }
        }


    };

    var fix_addy_script_only=function(script) {
        console.log("In fix_addy_script, script="+script.innerHTML);
        var addy=script.innerHTML.match(/var (addy[\da-z]+\s*\=)/),split=script.innerHTML.split("\n");
        var str_list=[""],i,addy_reg,match,email,str_reg=/\'[^\']*\'/g;
        const reducer = (acc, curr) => acc + curr.replace(/\'/g,"");
        const replacer = (match,p1) => String.fromCharCode(parseInt(p1));
        if(!addy) return;
        addy_reg=new RegExp(addy[1]);
        for(i=0;i<split.length;i++) if(addy_reg.test(split[i]) && (match=split[i].match(str_reg))) str_list=str_list.concat(match);
        email=str_list.reduce(reducer);
        while(/&#([\d]+);/.test(email)) email=email.replace(/&#([\d]+);/,replacer);
        console.log("email="+email);
        if(email.match(email_re)) {
            if(script.parentNode) script.parentNode.innerHTML=email;
            console.log("script.parentNode="+script.parentNode);
            //script.innerHTML=email;
        }
    };
    //console.log("email="+email);

    var contact_response_scripts=function(doc,url,extra) {
        var x,scripts=doc.scripts;
        for(x=0;x<scripts.length;x++) {
            var unesc_regex=/(?:unescape|decodeURIComponent)\((?:[\"\']{1})([^\"\"]+)(?:[\"\']{1})/;
            //console.log("scripts["+x+"]="+scripts[x].innerHTML);
            var match=scripts[x].innerHTML.match(unesc_regex),decoded,match2;
            if(/var addy[\d]+/.test(scripts[x].innerHTML)) fix_addy_script_only(scripts[x]);

            if(match&&(decoded=decodeURIComponent(match[1]))&&(match2=decoded.match(email_re)) && my_query.fields.email.length===0) {
                console.log("Matched weird decode");
                my_query.fields.email=match2[0];

            }
            else if(scripts[x].innerHTML.length<100000&&
                   (match=scripts[x].innerHTML.match(/[\'\"]{1}([\<\>^\'\"\n\s\t;\)\(]+@[^\>\<\'\"\s\n\t;\)\(]+\.[^\<\>\'\"\s\n\t;\)\(]+)[\'\"]{1}/))) {
                    if((match2=match[1].match(email_re)) && !MTP.is_bad_email(match2[0])) {
                        console.log("Found email in scripts "+scripts[x].innerHTML);
                        my_query.fields.email=match[1];
                    }
               // console.timeEnd("search");
            }




            scripts[x].innerHTML="";
        }
    };

    function is_bad_page(doc,title,url) {
        var links=doc.links,i,scripts=doc.scripts;
        var iframes=doc.querySelectorAll("iframe");
        for(i=0;i<iframes.length;i++) {
            if(iframes[i].src&&/parked\-content\.godaddy\.com/.test(iframes[i].src)) return "for sale.";
        }
        if(/hugedomains\.com|qfind\.net|\?reqp\=1&reqr\=/.test(url)||/is for sale/.test(title)) { return "for sale."; }
        else if(/Expired|^404|Error/.test(title)) return "dead.";
        else if(doc.querySelector("div.leftblk h3.domain_name")) return "dead.";
        if(/^(IIS7|404)/.test(title.trim())) return "dead.";
        if((doc.title===MTP.get_domain_only(url,true)&& doc.body.innerHTML.length<500)) return "dead.";

        return null;
    }

     var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) {
                               console.log("Fail");

                               MTurk.doneQueries++;
                               callback();
                           },
                           ontimeout: function(response) {
                               console.log("Fail timeout");
                               MTurk.doneQueries++;
                               callback(); }
                          });
    };


    function find_contact_form(doc,url) {
        var form=doc.querySelector("form.wpcf7-form");
        if(/\/contact/.test(url) && form) {
            my_query.form_list.push(url);
        }
    }


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);

        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.email,title_result;
        find_contact_form(doc,url);
        if(extension===undefined) extension='';
        if(extra.extension==='' && (title_result=is_bad_page(doc,doc.title,url))) {
        }
        if(/wix\.com/.test(url)) {
            callback();
            return; }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        MTP.fix_emails(doc,url);
        contact_response_scripts(doc,url,extra);
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }
        var headers=doc.querySelectorAll("h1,h2,h3,h4,h5,strong");
        for(i=0;i<headers.length;i++) {
           // console.log("headers["+i+"]="+headers[i].innerText);
            if(my_query.fields.first.length===1) {
    //           do_nlp(headers[i].innerText,url); /* do_nlp for name */

            }
        }

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".");
        MTP.fix_emails(doc,url);
        if((email_matches=doc.body.innerHTML.match(email_re))) {
            my_query.email_list=my_query.email_list.concat(email_matches);
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {
            if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
             if(/facebook\.com\/.+/.test(links[i].href) && (/\/pages\//.test(links[i].href) || !MTP.is_bad_fb(links[i].href)) &&
               my_query.fb_url.length===0 && !my_query.found_fb) {
                console.log("FOUND FB");
                my_query.found_fb=true;
                my_query.done.fb=false;
                my_query.fb_url=links[i].href.replace(/\?.*$/,"").replace(/\/pages\/([^\/]*)\/([^\/]*)/,"/$1-$2");
                fb_promise_then(my_query.fb_url);
            }
             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' &&
               (contact_regex.test(links[i].innerText)||/\/(contact)/i.test(links[i].href))
                && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url))) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            //if(my_query.fields.email.length>0) continue;
            if(links[i].dataset.encEmail && (temp_email=MTP.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTP.is_bad_email(temp_email)) my_query.email_list.push(temp_email.toString());
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTP.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.email_list.push(temp_email.toString());
            else if(links[i].dataset!==undefined && links[i].dataset.cfemail!==undefined && (encoded_match=links[i].dataset.cfemail) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.email_list.push(temp_email.toString());
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push(temp_email.toString());
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.email_list.push(temp_email.toString());
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        console.log("Calling evaluate emails from contact_response");
        evaluate_emails(callback);
        return;
    };

    function remove_dups(lst) {
        console.log("in remove_dups,lst="+JSON.stringify(lst));
        for(var i=lst.length;i>0;i--) if(typeof(lst[i])!=="string"||(typeof(lst[i-1]==="string") &&
            lst[i].toLowerCase()===lst[i-1].toLowerCase())) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name */
    function evaluate_emails(callback) {
      //  console.log("name="+JSON.stringify(my_query.fullname));
        for(i=0;i<my_query.email_list.length;i++) {
            my_query.email_list[i]=my_query.email_list[i].replace(/^[^@]+\//,"").replace(/(\.[a-z]{3})yX$/,"$1"); }
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
        my_query.fullname={fname:my_query.fields.first,lname:""};
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];
        // Judges the quality of an email
        function EmailQual(email) {
            this.email=email;
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            if(/wix\.com/.test(this.email)) return;
            if(/^(info|contact|admission|market)/.test(email)) this.quality=1;
            else this.quality=2;
            if(new RegExp(my_query.fullname.fname,"i").test(email)) this.quality=3;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email)) {
                this.quality=4;
                if(email.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email.toLowerCase().charAt(0)) this.quality=5;
            }
            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=6;
            if(this.email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.url,true)) this.quality+=5;

        }
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(MTP.is_bad_email(my_query.email_list[i])) continue;
            curremail=new EmailQual(my_query.email_list[i].trim());
            if(curremail.quality>0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return b.quality-a.quality; });
        console.log("my_email_list="+JSON.stringify(my_email_list));
        if(my_email_list.length>0) {
            my_query.fields.email=my_email_list[0].email;
            console.log("my_email_list.length>0, calling submit_if_done from evaluate_emails");
            callback();
            return true;
        }
        console.log("my_email_list.length=0, calling submit_if_done from evaluate_emails");

        callback();
    }

    function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) {
             my_query.email_list.push(result.email);
            console.log("Calling evaluate emails, parse_insta_then");
            evaluate_emails(submit_if_done);
        }
       // if(result.email&&my_query.fields.email.length===0) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        console.log("Calling submit_if_done, parse_insta_then");

        submit_if_done();
    }


    function paste_name(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        var fullname=MTP.parse_name(text);
        my_query.fields.first=fullname.fname;
       // my_query.fields["last name"]=fullname.lname;
        add_to_sheet();
    }
    function gov_promise_then(my_result) {
        var i,curr,fullname,x,num;
        my_query.done.gov=true;
        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
         var person_list=[];
    console.log("Gov result="+JSON.stringify(result));

         var type_lists={"Records":{lst:[],num:'3'},"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}}
         for(i=0;i<result.length;i++) {
             temp=new PersonQual(result[i]);
             console.log("("+i+"), "+JSON.stringify(temp));
             if(temp.quality>0) {
                 person_list.push(temp); }
         }
         person_list.sort(cmp_people);
        my_query.person_list=person_list;
        console.log("Calling submit if done from gov_promise_then");
         submit_if_done();

//        console.log("result="+JSON.stringify(result));
    }

    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var terms=["name","title","phone","email"],x;
        var bad_last=/^(place|street)/i;
        this.last="";
        this.first="";
        for(x of terms) this[x]=curr[x]?curr[x]:"na";
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name) {
            this.name=this.name.replace(/^By /,"").replace(/^[^A-Za-z]+/,"");
            fullname=MTP.parse_name(curr.name);
            this.first=fullname.fname;
            this.last=fullname.lname;
        }
        if((!this.phone ||this.phone==="na") && Gov.phone) this.phone=Gov.phone;
        this.quality=0;
        if(curr.title) {
            if(/Director|Manager|President|CEO|Officer|Owner/.test(curr.title)) this.quality=3;
            else if(/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/.test(curr.title)) this.quality=1;
        }

      //  if(this.email && this.email.indexOf("@")!==-1) this.quality+=5;
        var nlp_out=nlp(this.name).people().out('terms');
        if(nlp_out&&nlp_out.length>0) {
            console.log("GLunch");
            //console.log(nlp_out);

            this.quality+=2;
        }
        else this.quality=0;
        if(this.email && MTP.get_domain_only(my_query.url,true)===this.email.replace(/^[^@]*@/,"")) this.quality+=1;
        if(!this.email || this.email==="na") this.quality=-1;
        if(/[\d\?:]+/.test(this.name)) this.quality=-1;
        if(this.name.split(" ").length>4) this.quality=-1;
        else if(MTP.is_bad_email(this.email)) this.quality=-1;
        else if(bad_last.test(this.last)) this.quality=-1;

    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

    function complete_partial_url(url) {
        if(/^www\./.test(url)) url="http://"+url;
        else if(!/^https?:/.test(url)) url="http://www."+url;
        return url;
    }

    function init_Query() {
        console.log("in init_query");
        var i,promise,st;
        bad_urls=bad_urls.concat(default_bad_urls);
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];

        my_query={url:wT.rows[0].cells[1].innerText,fb_url:"",insta_url:"",person_list:"",found_fb:false,
                                    fields:{email:"",first:" "},done:{url:false,fb:false,gov:false},submitted:false,email_list:[],
                 form_list:[]};
        my_query.domain=MTP.get_domain_only(my_query.url,true);

        my_query.url=complete_partial_url(my_query.url).replace(/(https?:\/\/[^\/]*).*$/,"$1");
        call_contact_page(my_query.url,submit_if_done);

        console.log("my_query="+JSON.stringify(my_query));
        var dept_regex_lst=[];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            if(my_query.fields.email.length===0) my_query.fields.email="NA";
            my_query.done.gov=true;
            submit_if_done(); },query);


    }

})();