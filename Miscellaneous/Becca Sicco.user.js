// ==UserScript==
// @name         Becca Sicco
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Coaches and Such TODO COPY SCRAPING STUFF THAT'S USEFUL!!!
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
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/28de482ce858f34de89848bdf3154499b10ed715/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/3aeb4a21d388be6ae2218ffa34db690ff175fbbf/Govt/Government.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js

// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/app.lead411.com",".zoominfo.com",".privateschoolreview.com",".facebook.com",".niche.com","en.wikipedia.org",".yelp.com","hunter.io",
                 ".zoominfo.com","issuu.com","skymem.com","facebook.com"];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A467G6KGCYUI6",true);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    function is_bad_name(b_name,p_caption,i)
    {
        var orig_b_name=b_name;
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                        function(match,p1,p2,p3) {
            if(/Saint/i.test(p2)) return p1+"St"+p3;
            else return p1+"Mt"+p3; });

        my_query.name=my_query.name.replace("’","\'").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                        function(match,p1,p2,p3) {
            if(/Saint/i.test(p2)) return p1+"St"+p3;
            else return p1+"Mt"+p3; });
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        var b_name2=orig_b_name.split(/\s+[\-\|–]{1}\s+/),j;
        console.log("b_name2="+JSON.stringify(b_name2));
        for(j=0;j<b_name2.length;j++) {
            my_query.name=my_query.name.replace("’","\'");
            console.log("b_name="+b_name2[j]+", my_query.name="+my_query.name);
            if(MTP.matches_names(b_name2[j],my_query.name)) return false;
            if(b_name2[j].toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        }

        if(i===0) return false;
        return true;
    }

    function Coach(first,last,p_caption,pos) {
        var i;
        var name=first.text+" "+last.text;
        var orig_name=name;
        this.name=null;
        this.value=1+p_caption.length;
        name=name.replace(/\'/g,"\\\'").replace(/\./g,"\\\.").replace(/[\(\)\*]+/g,"");
        var name_len=orig_name.length;
        var multiplier=1;
       
        var fbcoach_match,coach_match,curr_value;
        var job_str=my_query.job==="AD"?"athletic director":"football coach";
         var subtracter=job_str.length;
        //console.log("Coach: name="+name);
        var fbcoach_re=new RegExp("("+job_str+".*"+name+")|("+name+".*"+job_str+")","ig");
        var coach_re=new RegExp("(coach.*"+name+")|("+name+".*coach)","ig");
        coach_match=p_caption.match(fbcoach_re);
        //console.log("fbcoach_re.source="+fbcoach_re.source+", coach_re.source="+coach_re.source);
        //console.log("fbcoach_match="+JSON.stringify(coach_match));
        if(!coach_match) {
            multiplier=2;
            subtracter="coach".length;
            //coach_match=p_caption.match(coach_re);
           // console.log("coach_match="+JSON.stringify(coach_match));
        }
        if(!coach_match) return;
        for(i=0;i<coach_match.length;i++) {
            curr_value=(coach_match[i].length-orig_name.length-subtracter)*multiplier*(pos+1);
            if(curr_value<this.value) {
                this.name=first.normal.replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); })+" "+
                    last.normal.replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
                this.value=curr_value; }
        }
    }
    Coach.toString=function() { return "("+this.name+", "+this.value+")"; };






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
        if(type==="email" && (mtch=p_caption.match(my_email_re))) {
            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push(mtch[j]);
        }
        if(type==="email") {
            if(i>3) return null;
            else if(!/\.(pdf|xls|xlsx|doc|docx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        }
        if(type==="coach") {
         /*   var c,x=nlp(p_caption).people().out("terms");
           for(j=0;j<x.length-1;j++) {
               if(x[j].tags.includes("FirstName")&&x[j+1].tags.includes("LastName")) {
                   c=new Coach(x[j],x[j+1],p_caption,i);
                   if(c.name) my_query.coach_list.push(c);
               }
           }*/
           try {
               if(i<2 && !/\.(pdf|xls|xlsx|doc|docx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) {
                   promise_list.push(MTurkScript.prototype.create_promise(b_url,Gov.load_scripts,MTP.my_then_func));
                   promise_list.push(MTP.create_promise(b_url,coach_response,MTP.my_then_func,MTP.my_catch_func,i));
               }
           }
            catch(error) { console.log("error in promise "+error); }

        }

        if(type==="maxpreps" && !/\/(scoreboard|games)\//.test(b_url) && new RegExp("\\/"+my_query.sport+"\\/","i").test(b_url) &&
           (b1_success=true)) return b_url;
        else if(type==="maxpreps") return null;
        if(type==="url" && !MTP.is_bad_url(b_url, bad_urls,5,2) && !is_bad_name(b_name) && (b1_success=true)) return b_url;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser().parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,result;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,loop_result;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,parsed_loc;
        var promise_list=[];
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            if((b_context=doc.getElementById("b_context"))&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(type==="url" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,5) && (resolve(parsed_context.url)||true)) return;
            }
            if((lgb_info=doc.getElementById("lgb_info"))&&
               (parsed_lgb=MTP.parse_lgb_info(lgb_info))) console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success);
                if(b_url&&(b1_success=true)) break;
            }
            if(type==="email") {
                Promise.all(promise_list).then(function() { done_promises_then({resolve:resolve,reject:reject}); })
                .catch(function() { reject("Failed email"); });
                return; }
            if(type==="coach") {
                Promise.all(promise_list).then(function() { resolve({resolve:resolve,reject:reject}); })
                .catch(function() { reject("Failed coach"); });
                return;
            }
            
            if(b1_success && (resolve(b_url)||true)) return;
            if(type==="url" && parsed_lgb&&parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,5) && (resolve(parsed_lgb.url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="maxpreps") {
            parse_maxpreps_then("");
            return;
        }
        if(type==="url" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" website",resolve,reject,query_response,"url");
        }

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
            if((match=scripts[i].innerHTML.match(insertEmailRegex)) ||
              (match=scripts[i].innerHTML.match(/FS\.util\.insertEmail\(\"[^\"]*\",\s*\"([^\"]*)\",\s*\"([^\"]*)\"/))
              ) fix_insertEmail(scripts[i],match);
            else scripts[i].innerHTML="";
        }
    };


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
        //MTP.fix_emails(doc,url);
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
        for(i=0; i < links.length; i++) {
            do_email_re_match(links[i]);
            if(my_query.fields.email.length>0) continue;
            try {
                if(links[i].dataset.encEmail && (temp_email=MTP.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
                   && !MTP.is_bad_email(temp_email.toString())) my_query.email_list.push(temp_email.toString());
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
                //else if(encoded_match) { console.log("encoded_match="+encoded_match); }
                //else if((clicky=links[i].getAttribute("onclick"))) { console.log("clicky="+clicky+", match="+clicky.match(/mailme/)); }
            }
            catch(error) { console.log("Error with emails "+error); }
        }
        console.log("* doing doneQueries++ for "+url);

        resolve(query);
        return;
    };

    var coach_response=function(doc,url,resolve,reject,pos) {
        console.log("in coach_response, url="+url);
        var style=doc.querySelectorAll("style");
        for(var i=0;i<style.length;i++) {
           style[i].innerHTML=""; }
        for(let i=0;i<doc.scripts.length;i++) {
           doc.scripts[i].innerHTML=""; }
        var text=doc.body.innerText;
        var c,x=nlp(text).people().out("terms"),j;
        for(j=0;j<x.length-1;j++) {
            if(x[j].tags.includes("FirstName")&&x[j+1].tags.includes("LastName") && !/Academy|School|Christian/i.test(x[j+1].normal)) {
                c=new Coach(x[j],x[j+1],text,pos);
                if(c.name) my_query.coach_list.push(c);
            }
        }
        console.log("coach_response: my_query.coach_list="+JSON.stringify(my_query.coach_list));
        contact_response(doc,url,resolve,reject,"");

//        resolve("");
    };

    function done_promises_then(query) {
        console.log("Done contact_response");
        evaluate_emails(query);
    }

    function remove_dups(lst) {
        for(var i=lst.length;i>0;i--) if(lst[i]===lst[i-1]) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name */
    function evaluate_emails(query) {
        console.log("name="+JSON.stringify(my_query.fullname));
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
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];
        /* Judges the quality of an email */
        function EmailQual(email) {
            this.email=email.replace(/(\.(com|org|edu|net)).*$/,"$1");
            var reg=/^.*\u0007(.*@.*)$/;
         //  console.log("### reg="+reg.source);
            this.email=email.replace(reg,"$1");
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            var email_begin=email.replace(/@[^@]*$/,"");
            if(new RegExp(my_query.fullname.fname,"i").test(email_begin)) this.quality=1;
             if(new RegExp(my_query.fullname.lname.substr(0,4)+"$","i").test(email_begin)) this.quality=1.5;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email_begin)) {
                this.quality=2;
                if(email_begin.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email_begin.toLowerCase().charAt(0)) this.quality=3;
            }
             if(email_begin.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email_begin.toLowerCase().charAt(0)) this.quality=3;
            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email_begin)) this.quality=4;
            if(this.domain===my_query.domain&&this.quality>0) this.quality+=4;
            if(/^(contact|info)/.test(this.email)) this.quality=0;
        }
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
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
        if(query!=undefined) {
            if(do_next_email_query(query.resolve,query.reject)) return false;
                else query.reject("Failed nothing found");
            return false;
        }
    }
    /* Try the next option for email queries */
    function do_next_email_query(resolve,reject) {
        var search_str;
        if(my_query.try_count.email===0) {
                my_query.try_count.email++;
                search_str="+\""+my_query.fullname.fname.toLowerCase()+"."+my_query.fullname.lname.toLowerCase()+"@"+my_query.domain+"\" OR "
            +"+\""+my_query.fullname.fname.toLowerCase()+my_query.fullname.lname.toLowerCase().charAt(0)+"@"+my_query.domain+"\"";
                //console.log("trying email again with "+search_str);
                query_search(search_str,resolve,reject,query_response,"email");
                return true;
            }
        else if(my_query.try_count.email===1) {
            my_query.try_count.email++;
            search_str=my_query.fields.name1+" site:"+my_query.domain;
            query_search(search_str,resolve,reject,query_response,"email");
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

    /* Get coach name from maxpreps site */
     function maxpreps_promise_then(result) {
         if(my_query.job!=="AD") result=result.replace(/(maxpreps\.com\/high-schools\/[^\/]+\/football\/).*$/,"$1roster.htm");
         else result=result.replace(/(maxpreps\.com\/high-schools\/[^\/]+\/).*$/,"$1home.htm");
         console.log("# maxpreps_promise_then, result="+result);
         var promise=MTP.create_promise(result,my_query.job!=="AD" ? parse_maxpreps_coach :
                                        parse_maxpreps_AD,parse_maxpreps_then);
    }
    /* Parse maxpreps */
    function parse_maxpreps_coach(doc,url,resolve,reject) {
        console.log("# parse_maxpreps_coach,url="+url);

        var abbr,content;
        if(my_query.job!=="HC" && (parse_maxpreps_staff(doc,url,resolve,reject)||true)) return;
        var ad=doc.querySelector("#ctl00_NavigationWithContentOverRelated_ContentOverRelated_PageHeaderUserControl_CoachName");
        if(!ad) {
            var temp=doc.querySelectorAll(".content-column dl");
            if(temp.length>1) {
                ad=temp[1].querySelector("dd");
            }
        }
        if(ad) {
            console.log("\t * Found ad");
            my_query.fields.name1=ad.innerText.trim().replace(/^((N\/A)|(DNF)).*$/,"").replace(/\t/g," ");
            }

        else {
            console.log("Did not find ad"); }
        resolve(my_query.fields.name1);
    }
    function parse_maxpreps_AD(doc,url,resolve,reject) {
        console.log("# parse_maxpreps_AD,url="+url);
        var abbr=doc.querySelector("[title='Athletic Director']"),content;
        var ad=doc.querySelector("#ctl00_NavigationWithContentOverRelated_ContentOverRelated_PageHeaderUserControl_AthleteDirectorDefinitionGenericControl");
        if(ad) {
            console.log("\t * Found athletic director with id");
            my_query.fields.name1=ad.innerText.trim().replace(/^((N\/A)|(DNF)|\/).*$/,"").replace(/\t/g," ");
        }
        else if(abbr && (content=abbr.parentNode.nextElementSibling)) {
            console.log("\t * Found athletic director with abbr");
            my_query.fields.name1=content.innerText.trim().replace(/^((N\/A)|(DNF)|\/).*$/,"").replace(/\t/g," ").trim(); }
        else {
            console.log("Did not find athletic director");
            //GM_setValue("returnHit",true);
            //return;

        }
        resolve(my_query.fields.name1);
    }


    /* parse staff table */
    function parse_maxpreps_staff(doc,url,resolve,reject) {
        console.log("parse_maxpreps_staff,url="+url);
        var inner_li=doc.querySelectorAll(".staff li"),name,role,i;
        console.log("inner_li.length="+inner_li.length);
        for(i=0;i<inner_li.length;i++) {
            name=inner_li[i].querySelector(".name");
            role=inner_li[i].querySelector(".role");
            if(name&&role) console.log("("+i+"), name="+name.innerText+", role="+role.innerText);
            if(name&&role&&my_query.job_regex.test(role.innerText) &&
               (my_query.fields.name1=name.innerText) && (resolve(my_query.fields.name1)||true)) return;
        }
        resolve(my_query.fields.name1);
    }


    function parse_maxpreps_then(result) {
        var search_str=my_query.name+" "+reverse_state_map[my_query.state];//+" "+my_query.fields.name1;//+" site:maxpreps.com";
        add_to_sheet();
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {


            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }



    /* Following maxpreps and search for school url */
    function query_promise_then(result) {
        console.log("query_promise_then (for school url),result="+result);
        my_query.school_url=result;
        my_query.domain=MTP.get_domain_only(result,true);
        if(my_query.fields.name1.length===0 && my_query.job==="HC") {
            console.log("Searching for coach elsewhere");
            find_coach();
            return;
        }
        else if(my_query.fields.name1.length===0 && my_query.job==="AD") {
            console.log("Searching elsewhere for athletic director");
            find_athletic_director();
            return;
        }
        else if(my_query.fields.name1.length===0) {
            console.log("No name, returning");
            GM_setValue("returnHit",true);
            return; }
        begin_email_promise();
        
    }

    function find_coach() {
        const coachPromise = new Promise((resolve, reject) => {
            console.log("# Beginning search for football coach");
            var domain=my_query.athletics_domain?my_query.athletics_domain : my_query.domain;
            query_search("football coach site:"+domain, resolve, reject, query_response,"coach");
        });
        coachPromise.then(coach_promise_then)
            .catch(function(val) {
            console.log("Failed at this coachPromise " + val); GM_setValue("returnHit",true); });
        // GM_setValue("returnHit",true);
        return;
    }

    function begin_email_promise() {

        var fullname=MTP.parse_name(my_query.fields.name1);
        my_query.fullname=fullname;
        my_query.fullname.lname=my_query.fullname.lname.replace(/\'/g,"");
        var search_str="+\""+fullname.fname.charAt(0).toLowerCase()+fullname.lname.toLowerCase()+"@"+my_query.domain+"\" OR "+
            "+\""+fullname.lname.toLowerCase()+fullname.fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\"";
        console.log("new search_str="+search_str);

        const emailPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           /* if(my_query.tried_new_ad) {
                my_query.try_count.email=1;
                do_next_email_query(resolve,reject);
                return;
            }*/
            query_search(search_str, resolve, reject, query_response,"email");
        });
        emailPromise.then(email_promise_then)
            .catch(function(val) {

            if(!my_query.tried_new_ad) {
                my_query.tried_new_ad=true;
                console.log("Trying to find athletic director on site");
                find_athletic_director();
                return;
            }
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }
    function email_promise_then(result) {
        console.log("In email_promise_then,result="+result); }
    /* Find athletic director on the school website */
    function find_athletic_director() {
        my_query.try_count["email"]=0;
        const coachPromise = new Promise((resolve, reject) => {
                console.log("# Beginning search for athletic director "+my_query.coach_try_count);
            var search_str="";
            if(my_query.coach_try_count===0) {
                search_str="athletic director site:"+my_query.domain;
            }
            else if(my_query.coach_try_count===1) {
                search_str="athletic directory "+my_query.name+" "+reverse_state_map[my_query.state];
            }
            query_search(search_str, resolve, reject, query_response,"coach");

            });
        coachPromise.then(coach_promise_then)
                .catch(function(val) {
                console.log("Failed at this coachPromise " + val); GM_setValue("returnHit",true); });
    }
    function arrange_gov_contacts() {
        var i,temp;

        for(i=0;i<Gov.contact_list.length;i++) {

            Gov.contact_list[i].quality=0;
            if(nlp(Gov.contact_list[i].title).people().out("topk").length>0 &&
               nlp(Gov.contact_list[i].name).people().out("topk").length===0) {
                temp=Gov.contact_list[i].title;
                Gov.contact_list[i].title=Gov.contact_list[i].name;
                Gov.contact_list[i].name=temp;
            }
            if(my_query.job==="AD") {
                if(Gov.contact_list[i].email) Gov.contact_list[i].email=Gov.contact_list[i].email.trim().replace(/^[\d]{2}([A-Za-z]{1})/,"$1");
                if(/Athletics|Athletic($|[^A-Za-z]+)/.test(Gov.contact_list[i].title)) Gov.contact_list[i].quality=1;
                if(/Athletic Director|Director of Athletics/i.test(Gov.contact_list[i].title)) Gov.contact_list[i].quality=2;
                if(/^(Athletic Director|Director of Athletics)$/i.test(Gov.contact_list[i].title)) Gov.contact_list[i].quality=3;
            }
            else if(my_query.job=="HC") {
                if(/Football/.test(Gov.contact_list[i].title)) {
                    Gov.contact_list[i].quality=2;
                    if(/Head /.test(Gov.contact_list[i].title)) Gov.contact_list[i].quality=3;
                }
                else if(/Head Coach/.test(Gov.contact_list[i].title)) Gov.contact_list[i].quality=1;
            }
        }
        Gov.contact_list.sort(function(a,b) { return b.quality-a.quality; });
    }

    function coach_promise_then(result) {
        var last;
        console.log("coach_promise_then: result="+JSON.stringify(result));
        console.log("my_query.coach_list="+JSON.stringify(my_query.coach_list));
        arrange_gov_contacts();
        console.log("Gov.contact_list="+JSON.stringify(Gov.contact_list));
        if(Gov.contact_list.length>0 && (last=Gov.contact_list[0]) && last.quality>=1) {
           my_query.fields.name1=last.name;
            if(last.email && last.email.length>0 && (my_query.fields.email=last.email) && (submit_if_done()||true)) return;
        }
        else if(my_query.coach_list.length>0) {
            my_query.coach_list.sort(function(a,b) { return a.value-b.value; });
            console.log("my_query.coach_list="+JSON.stringify(my_query.coach_list));
            my_query.fields.name1=my_query.coach_list[0].name;
        }
        if(my_query.coach_list.length===0) {
            if(my_query.coach_try_count===0) {
                my_query.coach_try_count++;
                if(my_query.job==="AD") { find_athletic_director(); }
                else { find_coach(); }
                return;
            }
            if(!my_query.tried_athletics) {
                my_query.tried_athletics=true;
                my_query.coach_try_count=0;
                my_query.fullname=MTP.parse_name(my_query.fields.name1);
                if(my_query.fields.name1.length>0 && evaluate_emails()) {
                    return; }

                console.log("No coaches found, trying last ditch with searching for athletics page, my_query="+JSON.stringify(my_query));
                var athleticspromise=MTP.create_promise(my_query.school_url,find_athletics,find_athletics_then,function() {
                    console.log("No coaches found, returning");
            GM_setValue("returnHit",true); return; });
                return;
            }
             console.log("No coaches found, returning");
            GM_setValue("returnHit",true);
            return;
        }
        add_to_sheet();
        begin_email_promise();
    }
    /* Find athletics page */
    function find_athletics(doc,url,resolve,reject) {
        console.log("in find_athletics,url="+url);
        var links=doc.links;
        for(var i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(/^Athletics$/i.test(links[i].innerText) && !/^(javascript|mailto)/.test(links[i].href) && (resolve(links[i].href||true))) return;
        }
        reject("");
    }
    function find_athletics_then(result) {
        my_query.athletics_url=result;
        var athleticsurl_promise=MTP.create_promise(my_query.athletics_url,check_ath_url,check_ath_url_then,function() {
                    console.log("No coaches found, returning");
            GM_setValue("returnHit",true); return; });
    }
    function check_ath_url(doc,url,resolve,reject) {
        console.log("in check_ath_url,url="+url);
        my_query.athletics_domain=MTP.get_domain_only(url,true);
        if(my_query.athletics_domain!==my_query.domain) resolve("");
        else reject("");
    }
    function check_ath_url_then(result) {
        console.log("Found new domain "+my_query.athletics_domain+" for athletes");
        find_coach();
    }


    function parse_state_then(result) {
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function init_Query()
    {
        console.log("in init_query");
        var i,promise,st;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:document.querySelector("[href='schoolname']").innerText,state:document.querySelector("[href='state']").innerText,
                  fields:{name1:"",email:""},done:{},submitted:false,try_count:{"email":0,"url":0},email_list:[],coach_list:[],
                 tried_new_ad:false,coach_try_count:0,tried_athletics:false};
        console.log("my_query="+JSON.stringify(my_query));
        my_query.name=my_query.name.replace(/^D\.b\.a\.\s*/i,"");
       /* if((st=StateAth[my_query.state])!==undefined) {
            promise=MTP.create_promise(st.url,st.parse,parse_state_then); }
        else
        {
            console.log(my_query.state+" not found");
            GM_setValue("returnHit",true);
        }*/

        my_query.job="HC"; // "AD" or "HC" or "DC"
         my_query.sport=(my_query.job!=="AD")?"football":"";
        my_query.job_regex=/Defensive Coordinator|DC|D(\.)? Coord/;
        Gov.query={dept_regex_lst:/.*/,title_regex_lst:/.*/i};
        Gov.debug=false;

        var search_str=my_query.name+" "+reverse_state_map[my_query.state]+" "+my_query.sport+" site:maxpreps.com";//+" site:maxpreps.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"maxpreps");
        });
        queryPromise.then(maxpreps_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

       
    }

})();