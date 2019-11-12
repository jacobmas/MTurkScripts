// ==UserScript==
// @name         Scott_Stiff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do Scott Stiff HITs
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.manta.com*
// @include https://www.buzzfile.com*
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
// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.js
// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.worker.js
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/9b8a01bacbf96ea1cf8ce57deb9073b925690277/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["lead411.com","prospectworx.com","infofree.com"];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"ASE78OM24HQVZ",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_algo,b_name,p_caption,i,type) {
        try {
            var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
            var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
       //       if(type==="linkedin" && /(^|[^A-Za-z])Inc($|[^A-Za-z\.])/i.test(b_name.replace(/\-\|.*$/,"").trim())) return true;
            if(type==="linkedin" && !/CEO|Chief Executive|President|Founder|Owner|Founder/i.test(b_algo.innerText)) return true;

            if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
            b_name=b_name.replace(b_replace_reg,"");
            let bob_name=my_query.name.replace("’","\'");
            if(!/linkedin/.test(type)) console.log("b_name="+b_name+", bob_name="+bob_name);
            if(type==="linkedin" &&
               b_algo.innerText.toLowerCase().indexOf(MTP.shorten_company_name(bob_name).toLowerCase())!==-1) return false;
            if((b_name && bob_name && MTP.matches_names(b_name,bob_name)) ||
               b_name.toLowerCase().indexOf(bob_name.toLowerCase())!==-1 ||
               bob_name.toLowerCase().indexOf(b_name.toLowerCase())!==-1) return false;
        }
        catch(error) { console.log("Error="+error); }

        return true;
    }
    function query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success,url) {
        var b_name,b_url,p_caption,b_caption;
        var mtch,j,people;
        b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
        b_url=b_algo[i].getElementsByTagName("a")[0].href;
        b_caption=b_algo[i].getElementsByClassName("b_caption");
        p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
            p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
        console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
        if(type==="email" &&!MTP.is_bad_url(b_url,bad_urls,-1) && (mtch=p_caption.match(email_re))) {

            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].toLowerCase().indexOf(my_query.domain)!==-1&&
                                              mtch[j].length>0) my_query.email_list.push({email:mtch[j],url:url});
        }
        if(type==="email") {
            if(i>3) return null;
            else if(!/\.(pdf|xls|xlsx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        }
        if(type==="bbb" && !/\/category|accredited-business-directory\//.test(b_url) && (reverse_state_map[my_query.state]===undefined ||
           new RegExp("\\/us\\/"+my_query.state+"\\/","i").test(b_url)) &&

                    !is_bad_name(b_algo[i],b_name.replace(/BBB Business Profile \| /,""),p_caption,i,type) && (b1_success=true)) return b_url;
         if(type==="buzzfile" &&
                    !is_bad_name(b_algo[i],b_name.replace(/ in [A-Z]+.*$/,""),p_caption,i,type) && (b1_success=true)) return b_url;
         if(type==="manta" &&
                    !is_bad_name(b_algo[i],p_caption.replace(/\s+is a privately.*$/,""),p_caption,i,type) && (b1_success=true)) return b_url;
        if(type==="linkedin" && /\/in\//.test(b_url) &&
                    !is_bad_name(b_algo[i],b_name,p_caption,i,type) && (b1_success=true)) return b_url;
        
        else if(type==="linkedin") return null;
    }
    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type+", try_count="+my_query.try_count[type]);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,bm_details_overlay;
         var promise_list=[];
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
           // console.log("b_algo.length="+b_algo.length);
            if(/^coords$/.test(type) && (bm_details_overlay=doc.querySelector(".bm_details_overlay"))) {
                let parsed_details=JSON.parse(bm_details_overlay.dataset.detailsoverlay);
                resolve({lat:parsed_details.centerLatitude,lon:parsed_details.centerLongitude});
                return;
            }
            else if(/^coords$/.test(type)) {
                reject("");
                return;
            }

	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {

                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success,response.finalUrl);
                if(b_url&&(b1_success=true)) break;
            }
            if(type==="email") {
                Promise.all(promise_list).then(function() { done_promises_then({resolve:resolve,reject:reject}); });
                return; }

            if(type==="linkedin" && b1_success) {
                let match2=b_algo[i].innerText.replace(/\s+\.\.\.\s+.*$/,"").match(/CEO|Chief Executive|President|Founder|Owner|Partner/i);
                if(match2) {
                    resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],p_caption:p_caption,type:type});
                    return;
                }
            }
            else if(type==="bbb" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            else if(type==="buzzfile" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,
                                                                 b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            else if(type==="manta" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,
                                                                 b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;

        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="bbb" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(my_query.name+" "+(reverse_state_map[my_query.state]||"")+" site:bbb.org",resolve,reject,query_response,"bbb");
            return;
        }
        else if(type==="bbb" && my_query.try_count[type]>=1) {
            my_query.done.bbb=true;
           query_search("\""+my_query.name+"\" "+my_query.domain+ " (owner OR CEO OR president) site:linkedin.com",resolve,reject,query_response,"linkedin");
            return;
        }
        else if(type==="linkedin" && my_query.try_count[type]===0) {
                        my_query.try_count[type]++;
           query_search(my_query.name+" "+my_query.domain+" (owner OR CEO OR president) site:linkedin.com",resolve,reject,query_response,"linkedin");
            return;

        }
        else if(type==="linkedin" && my_query.try_count[type]===1) {
                        my_query.try_count[type]++;
           query_search("\""+MTP.shorten_company_name(my_query.name)+"\" "+" (owner OR CEO OR president) site:linkedin.com",resolve,reject,query_response,"linkedin");
            return;
        }
        reject("Nothing found for "+type);
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
        var t;
        if(my_query.fields.email.length===0 && (email_matches=doc.body.innerHTML.match(email_re))) {
            for(t of email_matches) {
                my_query.email_list.push({email:t,url:url});
            }
            //my_query.email_list=my_query.email_list.concat(email_matches);
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
            if(extension==='' &&
               (contact_regex.test(links[i].innerText)||/\/(contact|about)/i.test(links[i].href))
                && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url))) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            //if(my_query.fields.email.length>0) continue;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push({email:temp_email.toString(),url:url});
        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        //if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        //evaluate_emails();
        resolve("");
        return;
    };

    function done_promises_then(query) {
        console.log("Done contact_response");
        evaluate_emails(query);
    }

    function begin_email_promise() {
        if(!(my_query.fields.firstName && my_query.fields.lastName)) return;
        var fname=my_query.fields.firstName,lname=my_query.fields.lastName.replace(/\'/g,"");
        var search_str="+\""+fname.charAt(0).toLowerCase()+lname.toLowerCase()+"@"+my_query.domain+"\" OR "+
            "+\""+lname.toLowerCase()+fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\""+"\ OR "+fname.toLowerCase()+"@"+my_query.domain+"\"";
        console.log("new search_str="+search_str);

        const emailPromise = new Promise((resolve, reject) => {
            console.log("Beginning email search");
            query_search(search_str, resolve, reject, query_response,"email");
        });
        emailPromise.then(email_promise_then)
            .catch(function(val) {
            console.log("Failed at this emailPromise " + val);
            my_query.done.url=true;
            submit_if_done();
        });
    }

    function email_promise_then(result) {
        my_query.done.url=true;
        submit_if_done();
    }

    function remove_dups(lst) {

        for(var i=lst.length;i>0;i--) if(lst[i]===lst[i-1]) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name */
    function evaluate_emails(query) {
        console.log("evaluate_emails: name="+JSON.stringify(my_query.fullname));
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
        var fname=my_query.fields.firstName,lname=my_query.fields.lastName;

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+fname+"@")];
        /* Judges the quality of an email */
        function EmailQual1(email,source) {
            this.email=email;
            this.source=source;
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            if(new RegExp(fname,"i").test(email)) this.quality=1;
            if(new RegExp(lname.substr(0,5),"i").test(email)) {
                this.quality=2;
                if(email.toLowerCase().indexOf(lname.replace(/\'/g,"").toLowerCase())>0 &&
                   fname.toLowerCase().charAt(0)===email.toLowerCase().charAt(0)) this.quality=3;
            }
            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=4;
            if(this.domain===my_query.domain&&this.quality>0) this.quality+=4;
            if(this.domain==="infofree.com"||this.domain==="yumpu.com") this.quality=-1;
        }
        for(i=0;i<my_query.email_list.length;i++) {
           // console.log("my_query.email_list["+i+"]="+typeof(my_query.email_list[i]));
            if(MTP.is_bad_email(my_query.email_list[i].email)) continue;
            curremail=new EmailQual1(my_query.email_list[i].email.trim(),my_query.email_list[i].url);
            if(curremail.quality>0) my_email_list.push(curremail);
        }
        my_email_list.sort(function(a, b) { return a.quality-b.quality; });
        console.log("my_email_list="+JSON.stringify(my_email_list));
        if(my_email_list.length>0) {
            let top=my_email_list.pop();
            my_query.fields.email=top.email;
            my_query.fields.emailSource=top.source;
            if(my_query.people.length>0) {
                my_query.people[0].email=top.email;
                my_query.people[0].emailSource=top.source;
            }
            my_query.done.url=true;
            submit_if_done();
            return true;
        }
        else if(do_next_email_query(query.resolve,query.reject)) return false;
        else query.reject("Failed nothing found");
        return false;
    }

     /* Try the next option for email queries */
    function do_next_email_query(resolve,reject) {
        var search_str;
       // return false;
        var fname=my_query.fields.firstName,lname=my_query.fields.lastName;
        if(my_query.try_count.email===0) {
                my_query.try_count.email++;
                search_str="+\""+fname.toLowerCase()+"."+lname.toLowerCase()+"@"+my_query.domain+"\" OR "
            +"+\""+fname.toLowerCase()+lname.toLowerCase().charAt(0)+"@"+my_query.domain+"\" OR "+
                  "+\""+fname.toLowerCase()+"@"+my_query.domain+"\"";
                //console.log("trying email again with "+search_str);
                query_search(search_str,resolve,reject,query_response,"email");
                return true;
            }



        return false;
    }

    /* Following the finding the district stuff */
    function bbb_promise_then(result) {
        var promise,url;
        console.log("result="+JSON.stringify(result));
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
            if(contacts[i].name.first===null && contacts[i].name.last!==null) {
                let fullname=MTP.parse_name(contacts[i].name.last);
                if(fullname&&fullname.fname&&fullname.lname) {
                    contacts[i].name.first=fullname.fname;
                    contacts[i].name.last=fullname.lname;
                }
                else continue;
            }

            my_query.people.push(new Person({name:{first:contacts[i].name.first.replace(/\s.*$/,""),last:contacts[i].name.last},title:contacts[i].title,email:""},url,my_query.domain));
            if(/President|Owner|CEO/.test(contacts[i].title)) {
                Object.assign(my_query.fields,{firstName:contacts[i].name.first.replace(/\s.*$/,""),lastName:contacts[i].name.last,contactTitle:contacts[i].title,
                nameSource:url});
                add_to_sheet();
                break;
            }
        }
        resolve("");
        return;
    }
    function parse_bbb_then(result) {
        console.log("parse_bbb_then,result="+result);
        my_query.done.bbb=my_query.done.linkedin=true;
        submit_if_done();
    }
    function linkedin_promise_then(result) {
        console.log("linkedin_promise_then, result="+JSON.stringify(result));
        var name=result.b_name.replace(/ [\-\|]+.*$/,"").trim();
        console.log("name="+name);
        var fullname=MTP.parse_name(name);

        my_query.fields.firstName=fullname.fname;
        my_query.fields.lastName=fullname.lname;
        my_query.fields.nameSource=result.b_url;
        var match=result.b_algo.innerText.replace(/\s+\.\.\.\s+.*$/,"").match(/CEO|Chief Executive|President|Founder|Owner|Partner/i);
        if(match) {
           // console.log("# Matched on linkedin, match="+JSON.stringify(match));
            my_query.fields.contactTitle=match[0];
            my_query.people.push(new Person({name:{first:fullname.fname||"",last:fullname.lname||""},title:match[0],email:""},result.b_url,my_query.domain));
        }
        console.log("BUNK");
        
        submit_if_done();

    }

    function buzzfile_promise_then(result) {
        my_query.buzzfile_url=result.b_url;
        var promise=MTP.create_promise(result.b_url,AggParser.parse_buzzfile,parse_buzzfile_then);
    }
    function manta_promise_then(result) {
        console.log("Manta SUCCESS, url="+result.b_url);
        my_query.manta_url=result.b_url;
        my_query.done.manta=true;
//        var promise=MTP.create_promise(result.b_url,AggParser.parse_buzzfile,parse_buzzfile_then);
    }
    function parse_buzzfile_then(result) {
        console.log("in parse_buzzfile_then,result="+JSON.stringify(result));
        my_query.done.buzzfile=true;

        if(my_query.state&&my_query.state.length===2 && result.address&&result.address.state&&result.address.state.toLowerCase()!==my_query.state.toLowerCase()) {
            console.log("Bad buzzfile, state's don't match");
            my_query.done.linkedin=true;

            add_to_sheet();
            return;
        }
        if(result.name && result.title) {
            var fullname=MTP.parse_name(result.name);
            console.log("buzzfile: fullname="+JSON.stringify(fullname));
           /* Object.assign(my_query.fields,
                          {"firstName":fullname.fname,lastName:fullname.lname,nameSource:my_query.buzzfile_url,contactTitle:result.title});*/
            my_query.people.push(new Person({name:{first:fullname.fname||"",last:fullname.lname||""},title:result.title||"",email:""}
                                            ,my_query.buzzfile_url,my_query.domain,1));
        }
        my_query.done.linkedin=true;
        console.log("Done buzzfile,linkedin");
        submit_if_done();

    }
    function do_mailtester_stuff(the_domain) {
        if(the_domain===undefined) the_domain=my_query.domain;
        console.log("### In do_mailtester_stuff\n\n");
        if(my_query.people.length>0) {
            var person=my_query.people[0];
            console.log("person="+JSON.stringify(person));
            let fullname={fname:MTP.removeDiacritics(my_query.people[0].first),lname:MTP.removeDiacritics(my_query.people[0].last),mname:""};
            var mailPromise=new Promise((resolve,reject) => {
                var tester=new MailTester(fullname,the_domain,resolve,reject,true,mailpromise_then);
            });
            mailPromise.then(mailpromise_then).catch(function() {
                my_query.done.email=true;
                submit_if_done();
            });

            submit_if_done();
        }
    }

    function mailpromise_then(result) {
        var x,y;
        console.log("mailpromise_then,result="+JSON.stringify(result));
        my_query.done.email=true;
        for(x of my_query.people) {
            //if(x.quality>=100) x.quality=80;

            for(y of result) {
               // console.log(" x="+JSON.stringify(x)+", y="+JSON.stringify(y)+", typeof y="+typeof y);
                if(x.first===y.fname && x.last===y.lname&&(x.email==="" || !x.quality || ((80+y.quality)>=x.quality))) {
                    //console.log("Matched on x="+JSON.stringify(x)+", y="+JSON.stringify(y));
                    x.email=y.email;
                    x.emailSource=y.url;
                    x.quality=80+y.quality;
                    my_query.people.sort(person_cmp);
                    submit_if_done();
                    //return;
                }
            }
        }
        my_query.people.sort(person_cmp);
        submit_if_done();
        return;

    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&AggParser!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    function Person(curr,nameSource,emailDomain,quality) {
        var name,title,email;
        name=curr.name;
        title=curr.title;
        email=curr.email;
        if(name&&typeof(name)==="object" &&
           name.first && name.last) Object.assign(this,{first:name.first,middle:"",last:name.last});
        else if(name&&typeof(name)==="string") {
            let fullname=MTP.parse_name(name);
            Object.assign(this,{first:fullname.fname,middle:fullname.mname,last:fullname.lname}); }
        this.first=this.first.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
        this.last=this.last.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);

        this.title=title||"";
        this.nameSource=nameSource||"";
        this.email=email||"";
        this.emailDomain=emailDomain||"";
        this.emailSource=curr.emailSource||"";
        this.quality=0;
        if(quality) this.quality=quality;
        //if(/buzzfile\.com/.test(nameSource)) this.quality+=4;
        if(/CEO|Chief Executive|President|Founder|Owner|Principal/i.test(this.title) && !/Vice President/i.test(this.title)) this.quality+=3;

        Object.assign({email:"",emailSource:""});
        
    }
    function person_cmp(person1,person2) {


        if(person2.quality!==person1.quality)         return person2.quality-person1.quality;
  if(person1.email.length>0&&person2.email.length===0) return -1;
        else if(person2.email.length>0&&person1.email.length===0) return 1;

    }
    /* check through stuff, do_mailtester_stuff, etc */
    function do_add_to_sheet_preliminaries() {
        my_query.people.sort(person_cmp);
        var x,field,good;
        console.log("my_query.people="+JSON.stringify(my_query.people));
        if(my_query.people.length>0) {
            good=my_query.people[0];

            Object.assign(my_query.fields,
                          {"firstName":good.first,lastName:good.last,nameSource:good.nameSource||"",contactTitle:good.title,
                          email:good.email||"",emailSource:good.emailSource||""});
            console.log("my_query.done="+JSON.stringify(my_query.done));
            if(my_query.done.bbb&&my_query.done.linkedin&&my_query.done.buzzfile&&
               !my_query.done.url && !my_query.begun_mailtester) {
                /* No need to do manta */

                my_query.done.manta=true;

                my_query.begun_mailtester=true;
                do_mailtester_stuff();
            }
            else if(!my_query.done_alt_domain && my_query.max_domain) {
                console.log("Doing mailtester on "+my_query.max_domain);
                my_query.done_alt_domain=true;
                do_mailtester_stuff(my_query.max_domain);
            }

        }
        else if(my_query.done.bbb&&my_query.done.linkedin&&my_query.done.buzzfile&&my_query.done.coords&&!my_query.done.manta) {
            /* No people found, try manta */
            console.log("Nobody found, trying manta");
            const mantaPromise = new Promise((resolve, reject) => {
                AggParser.do_manta_search(my_query.name,my_query.coords,resolve,reject);
            });
            mantaPromise.then(agg_manta_promise_then)
                .catch(function(val) {
                console.log("Failed at this aggmantaPromise " + val);
                my_query.done.manta=true;
                submit_if_done();
            });

        }
    }


    function agg_manta_promise_then(result) {
        console.log("manta result="+JSON.stringify(result));
        var schema=result.schema;
        var title_regex=/CEO|Chief Executive|Officer|President|Manager|Owner|Partner|Principal|Founder/i;
       // console.log("typeof schema.employee="+(typeof schema.employee));
        var curr_emp;
        if(schema.employee.length>1) {
            for(curr_emp of schema.employee) {
                if(curr_emp.jobTitle.length===0) curr_emp.jobTitle="President";
                if(curr_emp.jobTitle&&title_regex.test(curr_emp.jobTitle)) {
                    my_query.people.push(new Person(
                        {name:{first:curr_emp.givenName||"",last:curr_emp.familyName.replace(/,.*$/,"").replace(/^[^\s]*\s/g,"").trim()||""},
                         title:curr_emp.jobTitle||"",email:""},result.manta_url,my_query.domain));

                }
            }
        }
        else {
            if(schema&&schema.employee&&schema.employee.jobTitle.length===0) schema.employee.jobTitle="President";
            if(schema&&schema.employee&&schema.employee.jobTitle&&title_regex.test(schema.employee.jobTitle)) {
                my_query.people.push(new Person(
                    {name:{first:schema.employee.givenName||"",last:schema.employee.familyName.replace(/,.*$/,"").replace(/^[^\s]*\s/g,"").trim()||""},
                     title:schema.employee.jobTitle||"",email:""},result.manta_url,my_query.domain));

            }
        }
        my_query.done.manta=true;
        submit_if_done();
    }

    function add_to_sheet() {
        var x,field,good;
        do_add_to_sheet_preliminaries();
        for(x in my_query.fields) {
           // console.log("my_query.fields["+x+"]="+my_query.fields[x]);
           if((field=document.getElementsByName(x)) && field.length>0 && (field=field[0]) && document.getElementsByName(x)[0].value&&
              document.getElementsByName(x)[0].value.length>0 &&
              (!my_query.fields[x]||my_query.fields[x].length===0)) {
                my_query.fields[x]=document.getElementsByName(x)[0].value; }
            else if(!field) { console.log("Could not find field "+x); }
        }
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;

        add_to_sheet();
        console.log("people="+JSON.stringify(my_query.people));
        console.log("my_query.done="+JSON.stringify(my_query.done));
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
        if(ret.name===undefined) return;
        if(ret.title===undefined) ret.title="";
        var fullname=MTurkScript.prototype.parse_name(ret.name);
        my_query.fields.email=ret.email?ret.email:"";
        my_query.fields["firstName"]=fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
        my_query.fields["lastName"]=fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
        if(ret.title) my_query.fields.contactTitle=ret.title;
        my_query.paste_count++;
        if(ret.title!==undefined || true) {
            my_query.fields.url=false;
            my_query.people.push(new Person({name:{first:fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing),
                                             last:fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing)},title:ret.title||"",email:ret.email||""}
                                            ,"",my_query.domain,100+my_query.paste_count));
        }

        add_to_sheet();
        if(true||!my_query.fields.email) {
            do_mailtester_stuff();
        }
//        submit_if_done();



    }
    function gov_promise_then(result) {
        var x;
        var title_regex_lst=/CEO|Chief|Chief Executive|President|Founder|Owner|Manager|Director/i;
        console.log("Done gov_promise_then, Gov.email_list="+(Gov.email_list?JSON.stringify(Gov.email_list):""));
        my_query.email_list=my_query.email_list.concat(Gov.email_list);
        for(x of Gov.email_list) {
            let curr_dom=x.email.replace(/^[^@]*@/,"");
            if(my_query.domain_counts[curr_dom]===undefined) my_query.domain_counts[curr_dom]=1;
            else my_query.domain_counts[curr_dom]++;
        }
        var max_domain,max_count=0;
        for(x in my_query.domain_counts) {
            if(my_query.domain_counts[x]>max_count) {
                max_domain=x;
                max_count=my_query.domain_counts[x];
            }
        }
        console.log("# domain_counts="+JSON.stringify(my_query.domain_counts));
        for(x of Gov.contact_list) {
            console.log("x="+JSON.stringify(x));
            var fullname=MTP.parse_name(x.name)
            if(x.title && !/ at /.test(x.title)&& title_regex_lst.test(x.title) && !/^https?:\/\/[^\/]+$/.test(x.url.replace(/\/$/,""))) {
                my_query.people.push(new Person({name:{first:fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing),
                                             last:fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing)},title:x.title||"",email:x.email||"",
                                                emailSource:x.email!==undefined?(x.url||""):""}
                                            ,x.url||"",my_query.domain,1));
            }
        }
        console.log("Done Gov");
        for(x in my_query.people) console.log(JSON.stringify(my_query.people[x]));
        my_query.done.gov=true;
        if(max_domain&&my_query.domain!==max_domain) {
            my_query.max_domain=max_domain;
            console.log("Found max_domain="+max_domain);
        }
        submit_if_done();
    }

    /* Do inner buzzfile where I query it automatically, opens in tab, etc */
    function do_inner_buzzfile() {
        var innerbuzz_promise=new Promise((resolve,reject) => {
            AggParser.do_buzzfile_search(my_query.name,{city:my_query.city,state:my_query.state},resolve,reject);
        });
        innerbuzz_promise.then(inner_buzz_promise_then)
        .catch(function(response) {
            console.log("Failed inner_buzz, response="+response);
            my_query.done.buzzfile=my_query.done.linkedin=true;
            submit_if_done();
        });
    }
    /* The result of the buzzfile query, with result.buzzfile_url containing the buzzfile url */
    function inner_buzz_promise_then(result) {
        console.log("Done inner_buzz_promise, result="+JSON.stringify(result));
        my_query.buzzfile_url=result.buzzfile_url;
        var promise=MTP.create_promise(my_query.buzzfile_url,AggParser.parse_buzzfile,parse_buzzfile_then);
    }



    function init_Query() {
        console.log("in init_query");
     //   document.getElementsByName("email")[0].type="text";
        var i,a;

        var wT=document.querySelector("form table");
        a = wT.querySelector("a");
        wT.innerHTML=wT.innerHTML.replace(/https/g,"http");

        //console.log("a.outerHTML="+a.outerHTML);
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[1].cells[1].innerText,url:wT.rows[1].cells[0].innerText,city:wT.rows[1].cells[2].innerText,
                  state:wT.rows[1].cells[3].innerText,coords:{},email_list:[],domain_counts:{},
                  done:{buzzfile:false,bbb:false,linkedin:false,gov:false,email:false,coords:false,manta:false},
                  people:[],email_list:[],paste_count:0,done_alt_domain:false,max_domain:"",
                  fields:{"firstName":"","lastName":"",
                         "contactTitle":"","nameSource":"","email":"","emailSource":""},
                  submitted:false,
                  try_count:{"bbb":0,"linkedin":0,"email":0,"manta":0}};
        my_query.city=my_query.city==="0"?"":my_query.city;
        my_query.state=my_query.state==="0"?"":my_query.state;
        my_query.name=my_query.name.replace(/\s+[\|\-].*$/,"");
       
        if(!/^http/.test(my_query.url) && !/^www\./.test(my_query.url)) my_query.url="http://www."+my_query.url;
        else if(!/^http/.test(my_query.url)) my_query.url="http://"+my_query.url;
        my_query.url=my_query.url.replace(/^(https?:\/)([^\/])/,"$1/$2");
         my_query.domain=MTP.get_domain_only(my_query.url,true);
        if((a=wT.rows[1].cells[0].querySelector("a"))) a.href=my_query.url;
        
        console.log("my_query="+JSON.stringify(my_query));
        document.getElementsByName("firstName")[0].addEventListener("paste",name_paste);
        var search_str=my_query.name+" "+my_query.domain+" ( CEO OR owner OR chief executive OR president) "+"site:linkedin.com";
        const bbbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search("\""+my_query.name+"\" "+ my_query.domain+" "+(reverse_state_map[my_query.state]||"")+" site:bbb.org",resolve,reject,query_response,"bbb");
      //      query_search(search_str, resolve, reject, query_response,"linkedin");
        });
        bbbPromise.then(bbb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.bbb=true;
            submit_if_done();
        });

        const coordsPromise = new Promise((resolve, reject) => {
            console.log("Beginning Coords search");
            if(!my_query.city||!my_query.state) {
                reject("");
                return; }
            query_search(my_query.city+" "+(reverse_state_map[my_query.state]||""),resolve,reject,query_response,"coords");
      //      query_search(search_str, resolve, reject, query_response,"linkedin");
        });
        coordsPromise.then(function(result) {
            my_query.coords=result;
            my_query.done.coords=true;
            submit_if_done();
        })
            .catch(function(val) {
            console.log("Failed at this coordsPromise " + val);
            my_query.done.coords=true;
            submit_if_done();
        });
        const buzzfilePromise = new Promise((resolve, reject) => {
            console.log("Beginning buzzfile search");
            query_search("\""+my_query.name+"\" "+(reverse_state_map[my_query.state]||"")+" site:buzzfile.com",resolve,reject,query_response,"buzzfile");
            query_search(search_str, resolve, reject, query_response,"buzzfile");
            //reject("");
        });
        buzzfilePromise.then(buzzfile_promise_then)
            .catch(function(val) {
            console.log("Failed at this buzzfilePromise " + val);
            do_inner_buzzfile();
            submit_if_done();
        });

      /*  const mantaPromise = new Promise((resolve, reject) => {
            console.log("Beginning buzzfile search");
            query_search("\""+MTP.shorten_company_name(my_query.name)+"\" "+(my_query.state||"")+" site:manta.com",resolve,reject,query_response,"manta");
           // query_search(search_str, resolve, reject, query_response,"manta");
        });
        mantaPromise.then(manta_promise_then)
            .catch(function(val) {
            console.log("Failed at this mantaPromise " + val); 
            my_query.done.manta=true;
            submit_if_done();
        });*/
	//var parser=new PDFParser("http://www.lvmspta.org/docs/LVMSPTA-Contacts.pdf");

        var dept_regex_lst=[];

        var title_regex_lst=[/CEO|Chief Executive|Officer|Chief|President|Manager|Owner|Partner|Founder/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);

            my_query.done.gov=true;
            submit_if_done(); },query);
    }

})();