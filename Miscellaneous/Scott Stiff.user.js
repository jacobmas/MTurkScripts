// ==UserScript==
// @name         Scott Stiff
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
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"ASE78OM24HQVZ",true);
    var MTP=MTurkScript.prototype;
    var Gov=Gov||{contact_list:[],scripts_loaded:{},scripts_total:{},area_code:"",
                 split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s+-\s+)|\||                     |	|	|●|•/};
        /* Gov.parse_name_func is a helper function for parse_data_func */
    Gov.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr.\s*/,/^Mrs.\s*/,/^Ms.\s*/,/^Miss\s*/,/^Dr.\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(/[a-z]{2,}/.test(text)) {
            text=text.replace(/(,?\s*[A-Z]+)+$/,""); }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };
     Gov.parse_data_func=function(text) {
        var ret={};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, s_part="", second_arr,begin_name;
        var has_pasted_title=false;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Gov.split_lines_regex),split_lines=[],temp_split_lines,new_split;
        var found_email=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1));
        }
        else split_lines=split_lines_1;
        if(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").concat(split_lines.slice(1));
        split_lines=split_lines.filter(line => line);
        /** Additional code **/
        if(/Director|Department|Supervisor|Manager|Clerk/.test(split_lines[0]) &&
          (temp_split_lines=split_lines.splice(0,1))) split_lines.splice(1,0,temp_split_lines[0]);
        /** End additional code **/

        //console.log("parse_data_func: "+JSON.stringify(split_lines));
        var good_stuff_re=/[A-Za-z0-9]/;
        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j])) break;
        }
        if(j>=split_lines.length) return ret;
        var split_comma=split_lines[j].split(/,/);
        if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0])) {
           // console.log("Doing split_comma");
            var curr_last=split_lines.length-1;
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }

        if(split_lines.length>0 && j<split_lines.length &&
           split_lines[j] && split_lines[j].trim().length > 0) {
            if(!/\s/.test((begin_name=split_lines[j].trim()))
               && j+1 < split_lines.length) begin_name=begin_name+" "+split_lines[(j++)+1];
            ret.name=Gov.parse_name_func(begin_name);
        }
       // console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
          //  console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            s_part=second_arr[second_arr.length-1].trim();
            //console.log("s_part="+s_part);
            if(email_re.test(s_part) && (found_email=true)) ret.email=s_part.match(email_re)[0];
            else if(phone_re.test(s_part)) ret.phone=s_part.match(phone_re)[0];
            else if(s_part.length>10 && s_part.substr(0,10)==="Phone Icon" &&
                    phone_re.test(s_part.substr(11))) ret.phone=s_part.substr(11).match(phone_re)[0];
            else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1)
            {
                if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
                else if(has_pasted_title=true) ret.title=s_part.replace(/^Title:/,"").trim();
            }
        }
        return ret;
     };
    function is_bad_name(b_algo,b_name,p_caption,i,type) {
        try
        {
            var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
            var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
            if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
            b_name=b_name.replace(b_replace_reg,"");
            my_query.name=my_query.name.replace("’","\'");
            console.log("b_name="+b_name+", my_query.name="+my_query.name);
            if(type==="linkedin" && !/CEO|Chief Executive|President|Founder|Owner|Founder/i.test(b_algo.innerText)) return true;

            if((b_name && my_query.name && MTP.matches_names(b_name,my_query.name)) ||
               b_algo.innerText.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1 ||
               my_query.name.toLowerCase().indexOf(b_algo.innerText.toLowerCase())!==-1) return false;

            if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        }
        catch(error) { console.log("Error="+error); }

        return true;
    }

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
        if(type==="email" && (mtch=p_caption.match(email_re))) {
            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push(mtch[j]);
        }
        if(type==="email") {
            if(i>3) return null;
            else if(!/\.(pdf|xls|xlsx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        }
        if(type==="linkedin" && /\/in\//.test(b_url) &&
                    !is_bad_name(b_algo[i],b_name,p_caption,i,type) && (b1_success=true)) return b_url;
        if(type==="bbb" &&
                    !is_bad_name(b_algo[i],b_name.replace(/BBB Business Profile \| /,""),p_caption,i,type) && (b1_success=true)) return b_url;
        else if(type==="linkedin") return null
    }


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
         var promise_list=[];
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
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success);
                if(b_url&&(b1_success=true)) break;
            }
           /* for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="linkedin" && /\/in\//.test(b_url) &&
                    !is_bad_name(b_algo[i],b_name,p_caption,i) && (b1_success=true)) {
                    console.log("MOO");

                    break; }
            }*/
            if(type==="email") {
                Promise.all(promise_list).then(function() { done_promises_then({resolve:resolve,reject:reject}); });
                return; }
            if(type==="linkedin" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            else if(type==="bbb" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;

        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="bbb") {
           query_search(my_query.name+" (owner OR CEO or president) "+" site:linkedin.com",resolve,reject,query_response,"linkedin");
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


        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++) {
            do_email_re_match(links[i]);
            if(my_query.fields.email.length>0) continue;
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
            this.email=email;
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
        else if(do_next_email_query(query.resolve,query.reject)) return false;
        else query.reject("Failed nothing found");
        return false;
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        var promise,url;
        if(result.type==="linkedin") { linkedin_promise_then(result); return; }
        else if(result.type==="bbb") {
            console.log("Doing bbb at "+JSON.stringify(result));
            url=result.b_url.replace(/\/complaints$/,"");
            promise=MTP.create_promise(url,parse_bbb,parse_bbb_then);
            return;
        }
    }
    function parse_bbb(doc,url,resolve,reject) {
        console.log("In parse_bbb,url="+url);
        var script=doc.querySelectorAll("script"),i,split_text,fullname;
        var regex=/\s*window\.__PRELOADED_STATE__\s*\=\s*(.*);\s*$/,match,parsed,x;
        for(i=0;i<script.length;i++) {

            if((match=script[i].innerHTML.match(regex))) {
               // console.log("script["+i+"].innerHTML="+script[i].innerHTML);
                parsed=JSON.parse(match[1]);
                parse_bbb_inner(doc,url,resolve,reject,parsed);
                return;
            }

          
        }

    }
    function parse_bbb_inner(doc,url,resolve,reject,parsed) {
        var i;
        var contacts=parsed.businessProfile.contactInformation.contacts;
        for(i=0;i<contacts.length;i++) {
            console.log("contacts["+i+"]="+JSON.stringify(contacts[i]));
            if(/President|Owner|CEO/.test(contacts[i].title)) {
                my_query.fields.firstName=contacts[i].name.first;
                my_query.fields.lastName=contacts[i].name.last;
                my_query.fields.contactTitle=contacts[i].title;
                my_query.fields.nameSource=url;
                add_to_sheet();
                resolve("");
                return;
            }
        }
        resolve("");
        return;
    }
    function parse_bbb_then(result) {
        console.log("parse_bbb_then,result="+result); }
    function linkedin_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        var name=result.b_name.replace(/ [\-\|]+.*$/,"").trim();
        var fullname=MTP.parse_name(name);
        my_query.fields.firstName=fullname.fname;
        my_query.fields.lastName=fullname.lname;
        my_query.fields.nameSource=result.b_url;
        var match=result.b_algo.innerText.match(/CEO|Chief Executive|President|Founder|Owner/);
        if(match) my_query.fields.contactTitle=match[0];
        add_to_sheet();

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
            if((field=document.getElementsByName(x)[0]) && field.value.length>0 && my_query.fields[x].length===0) {
                my_query.fields[x]=document.getElementsByName(x)[0].value; }
            else if(!field) { console.log("Could not find field "+x); }
        }
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function proper_casing(match,p1,p2) {
        return p1+p2.toLowerCase(); }

    function name_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        console.log("Moo in name_paste");
        var text = ""+e.clipboardData.getData("text/plain");
        console.log("text="+text);
        var ret=Gov.parse_data_func(text);
        console.log("ret="+JSON.stringify(ret));

        var fullname=MTurkScript.prototype.parse_name(ret.name);
        my_query.fields.email=ret.email?ret.email:"";
        my_query.fields["firstName"]=fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
        my_query.fields["lastName"]=fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
        if(ret.title) my_query.fields.contactTitle=ret.title;


        submit_if_done();



    }


    function init_Query()
    {
        console.log("in init_query");
     //   document.getElementsByName("email")[0].type="text";
        var i,a;

        var wT=document.querySelector("form table");
        a = wT.querySelector("a");
        wT.innerHTML=wT.innerHTML.replace(/https/g,"http");

        console.log("a.outerHTML="+a.outerHTML);
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[1].cells[1].innerText,url:wT.rows[1].cells[0].innerText,city:wT.rows[1].cells[2].innerText,
                  state:wT.rows[1].cells[3].innerText,
                  fields:{"firstName":"","lastName":"",
                         "contactTitle":"","nameSource":"","email":"","emailSource":""},done:{},submitted:false};
        if(!/^http/.test(my_query.url) && !/^www\./.test(my_query.url)) my_query.url="http://www."+my_query.url;
        else if(!/^http/.test(my_query.url)) my_query.url="http://"+my_query.url;
        if((a=wT.rows[1].cells[0].querySelector("a"))) a.href=my_query.url;
        //my_query.city=my_query.location.split(",")[0].trim();
        //my_query.state=my_query.location.split(",").length>1?my_query.location.split(",")[1].trim():my_query.location.match(/.{2}$/,"");

	console.log("my_query="+JSON.stringify(my_query));
        document.getElementsByName("firstName")[0].addEventListener("paste",name_paste);
        var search_str=my_query.name+" ( CEO OR owner OR chief executive) "+"site:linkedin.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+reverse_state_map[my_query.state]+" site:bbb.org",resolve,reject,query_response,"bbb");
            //query_search(search_str, resolve, reject, query_response,"linkedin");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();