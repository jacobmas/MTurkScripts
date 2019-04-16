// ==UserScript==
// @name         FindPersonalEmailAdverator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adverator for Real Estate
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_deleteValue
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
                 ".zoominfo.com","issuu.com","linkedin.com","realtor.com","homes.com","zillow.com","homelight.com","skymem.com","ufind.name","xome.com",
                 "corporationwiki.com","downloademail.info","realestatebook.com","redfin.com","beenverified.com","liveemaildatabase","ripoffreport.com"];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A39FDYCEJJI6JQ",false);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    function is_bad_name(b_name)  { return false; }
    function is_bad_name2(b_name,p_caption,i)
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
    /* A loop in query_response */
    function query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success)
    {
        var b_name,b_url,p_caption,b_caption;
        var mtch,j,people;
        b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
        b_url=b_algo[i].getElementsByTagName("a")[0].href;
        b_caption=b_algo[i].getElementsByClassName("b_caption");
        p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
            p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
        console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
        if(type==="email_query" && (mtch=p_caption.match(my_email_re))) {
            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push(mtch[j]);
        }
        if(type==="email_query") {
            if(i>1) return null;
            else if(!/\.(pdf|xls|xlsx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) {
                console.log("Calling contact_response,email_query");
                promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
            }
        }
        if(type==="fb_query" && !MTP.is_bad_fb(b_url) && !is_bad_name2(b_name,p_caption,i) && (b1_success=true)) return b_url;
        if(type==="url" && !MTP.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name) && (b1_success=true)) return b_url;
        if(type==="website" && !MTP.is_bad_url(b_url, bad_urls,5) && !is_bad_name(b_name) && (b1_success=true)) return b_url;
    }

    function find_vcf(response, resolve, reject)  {
        var text=response.responseText;
        console.log("VCF text=\n"+text);
        var email_re=/INTERNET:(\w[^@]*@[^@\n\s]+)/;
        var the_match=text.match(email_re);
        if(the_match!==null&&the_match.length>1) {
            console.log("Found Email in VCF "+the_match[1]);
            my_query.email_list.push(the_match[1]);
        }
        resolve("");

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
                if(type==="website" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,5) && (resolve(parsed_context.url)||true)) return;
            }
            console.log("TU");
            if((lgb_info=doc.getElementById("lgb_info"))&&
               (parsed_lgb=MTP.parse_lgb_info(lgb_info))) console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success);
                if(b_url&&(b1_success=true)) break;
            }
            if(type==="email_query") {
                Promise.all(promise_list).then(function() { done_promises_then({resolve:resolve,reject:reject}); });
                return; }
            else if(type==="coach") {
                my_query.coach_list.sort(function(a,b) { return b.value-a.value; });
                console.log("my_query.coach_list="+JSON.stringify(my_query.coach_list));
                Promise.all(promise_list).then(function() { resolve(""); });
                return;
            }
            if(b1_success && (resolve(b_url)||true)) return;
            if(/url/.test(type) && parsed_lgb&&parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,5) && (resolve(parsed_lgb.url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="website"&&my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.company+" real estate Florida",resolve,reject,query_response,type);
            return;
        }
        reject("Nothing found");
        return;
    }




    function convert_email_good(text) {
        var i,text_re=/\?e\=([\d]+)/,text_match,split_text=[],split_text2="",min_val=9999,x;
        if((text_match=text.match(text_re))) {
            for(i=0; i < text_match[1].length; i+=4) split_text.push(text_match[1].substr(i,4));
            /** Probably should fix to take the minimum valued one or something in case it's .k12.XX.us **/
            for(i=0; i < split_text.length; i++) if(parseInt(split_text[i])<min_val) min_val=parseInt(split_text[i]);
            x=min_val;
            for(i=0; i < split_text.length; i++) split_text2=split_text2+String.fromCharCode(46+(parseInt(split_text[i])-x)/2);
           // console.log(JSON.stringify(split_text2));
            text=split_text2;
        }
        text=text.replace(/^mailto:/,"");
        return text;
    }
    /**
     * Match if it has the word email in the innerText
     */
    function do_email_re_match(link) {

        if(/\?e\=(\d+)/.test(link.href)) {
            link.innerHTML=convert_email_good(link.href);
            link.href="mailto:"+link.innerHTML;
        }
        else if(/\/email\/indexjspe([\d]+)/.test(link.href)) {
            //console.log("found "+link.href);
            let match;
            if((match=link.href.match(/\/email\/indexjspe([\d]+)/))) {
                link.innerHTML=convert_email_good("?e="+match[1]);
                link.href="mailto:"+link.innerHTML;
            }
        }
        else link.innerText=link.href.replace(/^\s*mailto:\s*/,"");

    }

    /* TODO: add these three to MTurkScript */
    var reverse_str=function(str) {
        var ret="",i;
        for(i=str.length-1;i>=0;i--) ret+=str.charAt(i);
        return ret;
    };

    var fix_insertEmail=function(script,match) {
        console.log("in fix_insertEmail, match="+match);
        var parent=script.parentNode;
        var email=reverse_str(match[2])+"@"+reverse_str(match[1]);
        parent.innerHTML=email;
    };

    var fix_script_emails=function(doc,url,resolve,reject,query) {
        var i,scripts=doc.scripts,match;
        var insertEmailRegex=/insertEmail\([\'\"]{1}([^\'\"]+)[\'\"]{1},\s*[\'\"]{1}([^\'\"]+)[\'\"]{1}\)/;
        for(i=0;i<scripts.length;i++) {
            //console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
            if((match=scripts[i].innerHTML.match(insertEmailRegex))) fix_insertEmail(scripts[i],match);
            else scripts[i].innerHTML="";
        }
    };

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;

        if(result.email && !is_bad_name(result.pageTitle)) { my_query.email_list.push(new EmailQual(result.email,1));
                         evaluate_emails();

                         }
        submit_if_done();
    }

    /**
     * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,resolve,reject,query) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;

        var begin_email=my_query.fields.email,clicky;
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        //for(x=0;x<scripts.length;x++) { scripts[x].innerHTML=""; }
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }
        fix_script_emails(doc,url,resolve,reject,query);

        //console.log(url+": "+JSON.stringify(nlp_temp));
//        console.log(nlp_temp);
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
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0) my_query.email_list.push(email_matches[j].toString());
            }
//            console.log("Found email hop="+my_query.fields.email);
        }
        console.timeEnd("beforeemailmatchesnew");


        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++) {
            do_email_re_match(links[i]);
            //if(my_query.fields.email.length>0) continue;
            try
            {
                if(links[i].dataset.encEmail && (temp_email=MTP.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
                   && !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
                if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
                {
                    //if(links[i].dataset) { console.log("links[i].dataset="+JSON.stringify(links[i].dataset)); }

                    //    console.log(short_name+": ("+i+")="+links[i].href);
                }
                if(/mailto/.test(links[i].className) && (temp_email=MTP.swrot13(links[i].href)) &&
                   !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
               if(links[i].dataset.domain&&links[i].dataset.username) my_query.email_list.push(links[i].dataset.username+"@"+links[i].dataset.domain);
                if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
                   (temp_email=MTP.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
                   !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
                else if(links[i].dataset!==undefined && links[i].dataset.cfemail!==undefined && (encoded_match=links[i].dataset.cfemail) &&
                        (temp_email=MTP.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
                        !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
                if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
                   !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
                if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
                   (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                    for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                    my_query.email_list.push(temp_email.toString());
                }
                if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
                   (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.email_list.push(MTP.DecryptX(encoded_match[1]).toString());
                if((clicky=links[i].getAttribute("onclick"))&&(encoded_match=clicky.match(/mailme\([\'\"]{1}([^\'\"]+)[\'\"]{1}/i))
                    && (temp_email=decodeURIComponent(encoded_match[1]).replace("[nospam]","@"))) my_query.email_list.push(temp_email.toString());
                if(/facebook.com/.test(links[i].href) && !MTP.is_bad_fb(links[i].href) && !my_query.found_fb)
                {
                    my_query.found_fb=true;
                    my_query.done.fb=false;
                    console.log("* Found fb="+links[i].href);
                    my_query.fb_about_url=links[i].href.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
                        .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
                    console.log("my_query.fb_about_url="+my_query.fb_about_url);
                    let fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);

                }
                //else if(encoded_match) { console.log("encoded_match="+encoded_match); }
                //else if((clicky=links[i].getAttribute("onclick"))) { console.log("clicky="+clicky+", match="+clicky.match(/mailme/)); }
            }
            catch(error) { console.log("Error with emails "+error); }
        }
        console.log("* doing doneQueries++ for "+url);

        resolve(query);
        return;
    };

    function done_promises_then(query) {
        console.log("Done contact_response");
        my_query.done.email_query=true;
        evaluate_emails(query);
    }

    function remove_dups(lst) {
        for(var i=lst.length;i>0;i--) if(lst[i]===lst[i-1]) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name */
    function evaluate_emails(query) {
        console.log("name="+JSON.stringify(my_query.fullname));
        for(i=0;i<my_query.email_list.length;i++) {
            if(!my_query.email_list[i] instanceof EmailQual) my_query.email_list[i]=my_query.email_list[i].replace(/^[^@]+\//,"").replace(/(\.[a-z]{3})yX$/,"$1"); }
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
       
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(my_query.email_list[i] instanceof EmailQual) {
                curremail=my_query.email_list[i];
                if(curremail.quality>0) my_email_list.push(curremail);
                continue;
            }
            if(MTP.is_bad_email(my_query.email_list[i])) continue;
            curremail=new EmailQual(my_query.email_list[i].trim());
            if(curremail.quality>0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return a.quality-b.quality; });
        console.log("my_email_list="+JSON.stringify(my_email_list));
        if(my_email_list.length>0) {
            my_query.fields.email=my_email_list.pop().email;
            submit_if_done();
            return true;
        }
        else if(query && do_next_email_query(query.resolve,query.reject)) return false;
        else if(query) query.reject("Failed nothing found");
        return false;
    }

    function do_next_email_query(resolve,reject) {
        var search_str;
        if(my_query.try_count.email===0) {
                my_query.try_count.email++;
                search_str="+\""+my_query.fullname.fname.toLowerCase()+"."+my_query.fullname.lname.toLowerCase()+"@"+my_query.domain+"\" OR "
            +"+\""+my_query.fullname.fname.toLowerCase()+my_query.fullname.lname.toLowerCase().charAt(0)+"@"+my_query.domain+"\"";
                //console.log("trying email again with "+search_str);
                query_search(search_str,resolve,reject,query_response,"email_query");
                return true;
            }
        else if(my_query.try_count.email===1) {
            my_query.try_count.email++;
            search_str=my_query.name+" site:"+my_query.domain;
            query_search(search_str,resolve,reject,query_response,"email_query");
            return true;
        }


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
function longestCommonSubsequence(set1, set2) {
        // Init LCS matrix.
        const lcsMatrix = Array(set2.length + 1).fill(null).map(() => Array(set1.length + 1).fill(null));

        // Fill first row with zeros.
        for (let columnIndex = 0; columnIndex <= set1.length; columnIndex += 1) {
            lcsMatrix[0][columnIndex] = 0;
        }

        // Fill first column with zeros.
        for (let rowIndex = 0; rowIndex <= set2.length; rowIndex += 1) {
            lcsMatrix[rowIndex][0] = 0;
        }

        // Fill rest of the column that correspond to each of two strings.
        for (let rowIndex = 1; rowIndex <= set2.length; rowIndex += 1) {
            for (let columnIndex = 1; columnIndex <= set1.length; columnIndex += 1) {
                if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                    lcsMatrix[rowIndex][columnIndex] = lcsMatrix[rowIndex - 1][columnIndex - 1] + 1;
                } else {
                    lcsMatrix[rowIndex][columnIndex] = Math.max(
                        lcsMatrix[rowIndex - 1][columnIndex],
                        lcsMatrix[rowIndex][columnIndex - 1],
                    );
                }
            }
        }

        // Calculate LCS based on LCS matrix.
        if (!lcsMatrix[set2.length][set1.length]) {
            // If the length of largest common string is zero then return empty string.
            return [''];
        }

        const longestSequence = [];
        let columnIndex = set1.length;
        let rowIndex = set2.length;

        while (columnIndex > 0 || rowIndex > 0) {
            if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                // Move by diagonal left-top.
                longestSequence.unshift(set1[columnIndex - 1]);
                columnIndex -= 1;
                rowIndex -= 1;
            } else if (lcsMatrix[rowIndex][columnIndex] === lcsMatrix[rowIndex][columnIndex - 1]) {
                // Move left.
                columnIndex -= 1;
            } else {
                // Move up.
                rowIndex -= 1;
            }
        }

        return longestSequence;
    }

    function EmailQual(email,quality) {
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");
        var initials=(my_query.fullname.fname&&my_query.fullname.fname.length>0?my_query.fullname.fname.charAt(0):"")+
            (my_query.fullname.mname&&my_query.fullname.mname.length>0?my_query.fullname.mname.charAt(0):"")+
            (my_query.fullname.lname&&my_query.fullname.lname.length>0?my_query.fullname.lname.charAt(0):"");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];
        /* Judges the quality of an email */
        this.email=email;
        this.domain=email.replace(/^[^@]*@/,"");
        var email_begin=email.replace(/@.*$/,"");
        if(quality) this.quality=quality;
        else {
            this.quality=0;
            console.log("initials="+initials);
            if(initials.toLowerCase()===email_begin.toLowerCase()) this.quality=2;
            if(my_query.fullname.fname.toLowerCase().indexOf(email_begin)!==-1) this.quality=1;
            if(new RegExp(my_query.fullname.fname,"i").test(email_begin)) this.quality=1;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email_begin)) {
                this.quality=2;
                if(email.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email.toLowerCase().charAt(0)) this.quality=3;
            }
            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=4;
            if(this.domain===my_query.domain&&this.quality>0) this.quality+=4;
        }
    }


    /* Following finding the domain */
    function query_promise_then(result) {
        console.log("query_promise_then,result="+result);
        my_query.domain=MTP.get_domain_only(result,true);

        var lname=my_query.fullname.lname.replace(/\'/g,""),fname=my_query.fullname.fname.replace(/\'/g,"");
        var search_str="+\""+fname.charAt(0).toLowerCase()+lname.toLowerCase()+"@"+my_query.domain+"\" OR "+
            "+\""+lname.toLowerCase()+fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\" OR +\""+
            fname+lname+"@"+my_query.domain+"\"";
        console.log("new search_str for emails ="+search_str);
        const emailPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search in query_promise_then");
            my_query.done.email_query=false;
            query_search(search_str, resolve, reject, query_response,"email_query");
        });
        emailPromise.then(email_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.email=true;
            my_query.done.email_query=true;
            check_and_submit();

        });
    }

    function query_promise_then2(result) {
        my_query.website=result;
                my_query.done.website=true;

        var promise=MTP.create_promise(my_query.website,parse_website,parse_website_then,function() {
            console.log("Failed loading "+my_query.website+" or otherwise in parse_website");
            my_query.done.realestate2=true;
            if(!my_query.found_fb) my_query.done.fb=true;
            submit_if_done();
        }
            ,"2");
        console.log("query_promise_then,result="+result);
        my_query.domain=MTP.get_domain_only(result,true);

        var lname=my_query.fullname.lname.replace(/\'/g,""),fname=my_query.fullname.fname.replace(/\'/g,"");
        var search_str="+\""+fname.charAt(0).toLowerCase()+lname.toLowerCase()+"@"+my_query.domain+"\" OR "+
            "+\""+lname.toLowerCase()+fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\" OR +\""+
            fname+lname+"@"+my_query.domain+"\"";
        console.log("new search_str for emails ="+search_str);
        const emailPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search in query_promise_then2");
            my_query.done.email_query=false;
//            resolve("");
           query_search(search_str+" site:"+my_query.domain, resolve, reject, query_response,"email_query");
        });
        emailPromise.then(email_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.email=true;
            my_query.done.email_query=true;
            submit_if_done();

        });
    }

    function parse_website(doc,url,resolve,reject,num) {
        var regex=/Contact|Agents|Brokers/,match,test_vcf=/(\.vcf$)|(vcard)/;;
        var i,links=doc.links,promise_list=[];
        console.log("CAlling contact_response, parse_website");
        promise_list.push(MTP.create_promise(url,contact_response,MTP.my_then_func));
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(regex.test(links[i].innerText) && !/^(mailto|tel|javascript):/.test(links[i].href)) {
                        console.log("CAlling contact_response, parse_website,i="+i);

                promise_list.push(MTP.create_promise(links[i].href,contact_response,MTP.my_then_func));
            }
            if(test_vcf.test(links[i].href)) {
                promise_list.push(new Promise((resolve,reject) => {
                    GM_xmlhttpRequest({method: 'GET',url:links[i].href,
                                       onload: function(response) { find_vcf(response, resolve, reject); }
                                      });
                }));
            }



            if(/facebook.com/.test(links[i].href) && !MTP.is_bad_fb(links[i].href) && !my_query.found_fb)
            {
                my_query.found_fb=true;
                my_query.done.fb=false;
                console.log("* Found fb="+links[i].href);
                my_query.fb_about_url=links[i].href.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
                    .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
                console.log("my_query.fb_about_url="+my_query.fb_about_url);
                let fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);

            }
        }
        Promise.all(promise_list).then(function() { parse_website_then(num) });

    }
    function parse_website_then(result) {
        console.log("Success in parse_website_then "+result);
        my_query.done["realestate"+result]=true;
        my_query.done.email=true;
        if(my_query.done.website && my_query.done.email && !my_query.found_fb) my_query.done.fb=true;
        evaluate_emails();

        submit_if_done();
    }

    function fb_query_promise_then(result) {
        my_query.done.fb_query=true;
        my_query.found_fb=true;
        my_query.done.fb=false;
        console.log("*fb_query_promise, Found fb="+result);
        my_query.fb_about_url=result.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
                    .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
        console.log("my_query.fb_about_url="+my_query.fb_about_url);
        let fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
        submit_if_done();
    }

    function email_promise_then(result) {
        my_query.done.email=true;

        console.log("In email_promise_then, result="+result);
        submit_if_done();
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
        my_query.fields.web_url=my_query.fields.email;

        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        console.log("submit_if_done, my_query.done="+JSON.stringify(my_query.done));
        var is_done=true,x,is_done_dones=true;
        if(!my_query.found_fb && my_query.done.website && my_query.done.realestate2 && my_query.done.email) my_query.done.fb=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(!my_query.submitted && is_done_dones) {
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
    }



    function init_Query()
    {
        console.log("in init_query");
        var i,promise,st;
        bad_urls=bad_urls.concat(default_bad_urls);
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];

        my_query={name:wT.rows[1].cells[1].innerText.trim(),
                  company:wT.rows[2].cells[1].innerText.trim(),found_fb:false,
                  fields:{singlefamily:"Y",email:"",firstname:"",lastname:""},
                  done:{"realestate2":false,website:false,fb:false,fb_query:false,email:false,email_query:false},submitted:false,try_count:{"email":0,"website":0},email_list:[]};
        my_query.fullname=MTP.parse_name(my_query.name);
        my_query.company=my_query.company.replace(/\s[-\(]+.*$/,"");
        my_query.fields.firstname=my_query.fullname.fname;
        my_query.fields.lastname=my_query.fullname.lname;
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.company+" real estate";
        add_to_sheet();

        if(/Fortune International Realty/.test(my_query.company)) {
        }

      /*  const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.company+" real estate", resolve, reject, query_response,"url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });*/
        const queryPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"website");
        });
        queryPromise2.then(query_promise_then2)
            .catch(function(val) {
            my_query.done.website=true;
            console.log("Failed at this queryPromise2 " + val); my_query.done.realestate2=true; submit_if_done(); });

        const fbqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.company+" site:facebook.com", resolve, reject, query_response,"fb_query");
        });
        fbqueryPromise.then(fb_query_promise_then)
            .catch(function(val) {
            my_query.done.fb_query=true;
            console.log("Failed at this fbquerypromise " + val);  submit_if_done(); });


    }

})();