// ==UserScript==
// @name         Janis Legler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  ICO Stuff, Find Company Leaders (see also Scott Stiff)
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,1000,[],begin_script,"A8NGDA1P6SY40",true);
    var MTP=MTurkScript.prototype;
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

            if(type==="linkedin" &&
               b_algo.innerText.toLowerCase().indexOf(MTP.shorten_company_name(my_query.name).toLowerCase())!==-1) return false;
            if((b_name && my_query.name && MTP.matches_names(b_name,my_query.name)) ||
               b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1 ||
               my_query.name.toLowerCase().indexOf(b_name.toLowerCase())!==-1) return false;

            //if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
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
            for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push({email:mtch[j],url:url});
        }
        if(type==="email") {
            if(i>3) return null;
            else if(!/\.(pdf|xls|xlsx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
        }
        if(type==="bbb" && !/\/category|accredited-business-directory\//.test(b_url) &&
                    !is_bad_name(b_algo[i],b_name.replace(/BBB Business Profile \| /,""),p_caption,i,type) && (b1_success=true)) return b_url;
         if(type==="buzzfile" &&
                    !is_bad_name(b_algo[i],b_name.replace(/ in [A-Z]+.*$/,""),p_caption,i,type) && (b1_success=true)) return b_url;
        if(type==="linkedin" && /\/in\//.test(b_url) &&
                    !is_bad_name(b_algo[i],b_name,p_caption,i,type) && (b1_success=true)) return b_url;
        else if(type==="linkedin") return null;
        if(type==="website" && !is_bad_name(b_algo[i],b_name,p_caption,i,type) && (b1_success=true)) return b_url;
        if(type==="person" && !is_bad_name(b_algo[i],b_name.replace(/\s*[\(\|]*.*$/,""),p_caption,i,type)&&(b1_success=true)) return b_url;
    }
    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
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
                b_url=query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success,response.finalUrl);
                if(b_url&&(b1_success=true)) break;
            }
            if(type==="email") {
                Promise.all(promise_list).then(function() { done_promises_then({resolve:resolve,reject:reject}); });
                return; }

            if(type==="linkedin" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            else if(type==="bbb" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            else if(type==="buzzfile" && b1_success && (resolve({b_name:b_algo[i].getElementsByTagName("a")[0].textContent,
                                                                 b_url:b_url,b_algo:b_algo[i],type:type})||true)) return;
            if(type==="website" && b1_success && (resolve(b_url)||true)) return;
            if(type==="person" && b1_success && (resolve(b_url)||true)) return;

        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="website" && b_algo.length>0) {
            b_name=b_algo[0].getElementsByTagName("a")[0].textContent;
            b_url=b_algo[0].getElementsByTagName("a")[0].href;
            b_caption=b_algo[0].getElementsByClassName("b_caption");
            p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                b_caption[0].getElementsByTagName("p")[0].innerText : '';
            resolve(b_url);
            return;
        }

        if(type==="linkedin" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
           query_search(my_query.name+"  site:linkedin.com",resolve,reject,query_response,"linkedin");
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

    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) {
                               console.log("Fail");
                               if(my_query.fields.Q6MultiLineTextInput.length===0) {
                                   my_query.fields.Q6MultiLineTextInput="Appears closed. "+url+" is dead";
                                   if(my_query.fields.email.length===0 && my_query.fields["first name"].length>0) my_query.fields["first name"]="";
                               }
                               MTurk.doneQueries++;
                               callback();
                           },
                           ontimeout: function(response) {
                               console.log("Fail timeout");
                               MTurk.doneQueries++;
                               callback(); }
                          });
    };

    /**
     * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,resolve,reject,query) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;

        var begin_email=my_query.fields.email,clicky;
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }
        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Staff|Coach)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url,t;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        MTP.fix_emails(doc,url);
        if((email_matches=doc.body.innerHTML.match(email_re))) {
            for(t of email_matches) my_query.email_list.push({email:t,url:url});
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++) {
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
        resolve({resolve:resolve,reject:reject});
        return;
    };

    function done_promises_then(query) {
        console.log("Done contact_response");
        evaluate_emails(query);
    }

    function begin_email_promise() {
        var fname=my_query.fields.firstName,lname=my_query.fields.lastName.replace(/\'/g,"");;
        var search_str="+\""+fname.charAt(0).toLowerCase()+lname.toLowerCase()+"@"+my_query.domain+"\" OR "+
            "+\""+lname.toLowerCase()+fname.charAt(0).toLowerCase()+"@"+my_query.domain+"\"";
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
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        if(my_query.email_list.length>0) {
            let top=my_query.email_list.pop();
            my_query.fields["Company Email Address"]=top.email;
            my_query.done.website=true;
            my_query.done.email=true;
            submit_if_done();
            query.resolve("");
            return true;
        }
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
    function query_promise_then(result) {
        var promise,url;
        console.log("query_promise_then, result="+result);
        my_query.icobench_url=result;
        promise=MTP.create_promise(my_query.icobench_url,parse_icobench,parse_icobench_then);
        //my_query.fields["Website URL"]=result;
    }
    function parse_team_member(elem) {
        var name,title;
        try {
            name=elem.querySelector("h3").innerText;
            title=elem.querySelector("h4").innerText;
        }
        catch(error) { console.log("Error name, title="+error); }
        var linkedin="",twitter="",email="";
        var socialurls=elem.querySelectorAll(".socials a");
        socialurls.forEach(function(socialurl) {
            if(socialurl.className==="linkedin") linkedin=socialurl.href;
            if(socialurl.className==="twitter") twitter=socialurl.href;
        });
        var p=new Person(name,title,linkedin,twitter,email);
        my_query.people.push(p);
    }
    function add_people(person1,person2,web_url,resolve,reject) {
        var term_map={name:"Full Name ",title:"Job Title ",
                      linkedin:"Linkedin Profile URL ",twitter:"Twitter Profile URL ",email:"Email Address 1"};
        var x;
        for(x in term_map) {
            my_query.fields[term_map[x]+"1"]=person1[x];
            my_query.fields[term_map[x]+"2"]=person2[x];
        }
        const personPromise1 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
          //  query_search("\""+my_query.name+"\" "+reverse_state_map[my_query.state]+" site:bbb.org",resolve,reject,query_response,"bbb");
            query_search("\""+person1.name+"\" "+my_query.name+ " site:twitter.com",resolve,reject,query_response,"person");
        });
        personPromise1.then(person1_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.person1=true;
            submit_if_done();
        });
        const personPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
          //  query_search("\""+my_query.name+"\" "+reverse_state_map[my_query.state]+" site:bbb.org",resolve,reject,query_response,"bbb");
            query_search("\""+person2.name+"\" "+my_query.name+ " site:twitter.com",resolve,reject,query_response,"person");
        });
        personPromise2.then(person2_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.person2=true;
            submit_if_done();
        });

        resolve("");

    }
    function person1_promise_then(result) {
        my_query.fields["Twitter Profile URL 1"]=result;
        submit_if_done();
    }
    function person2_promise_then(result) {
        my_query.fields["Twitter Profile URL 2"]=result;
        submit_if_done();
    }

    function parse_icobench(doc,url,resolve,reject) {
        var web_url=doc.querySelector("a.button_big").href.replace(/\/?\?utm_source\=icobench$/,"");
        var data_row=doc.querySelectorAll(".data_row");
        var teamrow=doc.querySelector("#team .row");
        var teammembers=teamrow.querySelectorAll(".col_3");
        data_row.forEach(function(elem) {
            var col2=elem.querySelectorAll(".col_2");
            if(col2.length>=2 && /Country/.test(col2[0].innerText)) my_query.fields["HQ Location"]=col2[1].innerText.trim();
        });
        var person1,person2;
        teammembers.forEach(parse_team_member);
        my_query.fields["Website URL"]=web_url;
        my_query.people.sort(person_cmp);
        if(my_query.people.length>=2) {
            my_query.person1=my_query.people[0];
            my_query.person2=my_query.people[1];
            add_people(my_query.person1,my_query.person2,web_url,resolve,reject);
        }
        var promise=MTP.create_promise(web_url,contact_response,evaluate_emails,function(response) {

            console.log("Failed web_url "+response); my_query.done.website=true;
            my_query.done.email=true;
            submit_if_done(); });



        console.log("my_query.people="+JSON.stringify(my_query.people));
        //resolve("");
    }
    function parse_icobench_then(result) {
        console.log("Done icobench");
        submit_if_done();
    }
    function linkedin_promise_then(result) {
        console.log("linkedin_promise_then, result="+JSON.stringify(result));
        var name=result.b_name.replace(/ [\-\|]+.*$/,"").trim();
        var fullname=MTP.parse_name(name);

        my_query.fields.firstName=fullname.fname;
        my_query.fields.lastName=fullname.lname;
        my_query.fields.nameSource=result.b_url;
        var match=result.b_algo.innerText.match(/CEO|Chief Executive|President|Founder|Owner/);
        if(match) {
            my_query.fields.contactTitle=match[0];
            my_query.people.push(new Person(name,match[0],result.b_url,my_query.domain)); }
        my_query.done.website=true;
        submit_if_done();

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
    function Person(name,title,linkedin,twitter,email) {
        this.name=name||"";
        this.title=title||"";
        this.linkedin=linkedin||"";
        this.twitter=twitter||"";
        this.email=email||"";
        this.quality=0;

        if(/^(Chief Executive Officer|CEO)/.test(this.title.trim())) this.quality=8;
        else if(/Founder/.test(this.title)) this.quality=7;
        else if(/^(Chief\s+(Technology|Information|Marketing|Development)\s+Officer|CTO|CIO|CMO|COO)/i.test(this.title.trim())) this.quality=7;

        else if(/Chief Executive/i.test(this.title)) this.quality=4;
        else if(/Chief (Technical|Technology)/i.test(this.title)) this.quality=3;
        else if(/(^|[^A-Za-z]{1})Chief /i.test(this.title)) this.quality=2;
        else if(/Manager/.test(this.title)) this.quality=1.5;
        else if(this.title.trim().length>0) this.quality=1;
        this.quality*=2;
        if(this.linkedin.length>0) this.quality++;
        if(this.twitter.length>0) this.quality++;
        //Object.assign({email:"",emailSource:""});

    }
    function person_cmp(person1,person2) {
        return person2.quality-person1.quality; }
    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        console.log("my_query.done="+JSON.stringify(my_query.done));

        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function proper_casing(match,p1,p2) {
     return p1+p2.toLowerCase(); }
    function save_fields() {
        var cinp=document.querySelectorAll("crowd-input"),x;
        for(x of cinp) {
            my_query.fields[x.name]=x.value;
        }
    }

    function name_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var name=e.target.name;
        var num=name.match(/[\d]+$/)[0];
        var text = e.clipboardData.getData("text/plain");
        console.log("text="+text);
        save_fields();
        var ret=Gov.parse_data_func(text);
        console.log("ret="+JSON.stringify(ret));
        if(ret.title===undefined) ret.title="";
        if(ret.name) my_query.fields["Full Name "+num]=ret.name;
        my_query.fields["Email Address "+num]=ret.email?ret.email:"";
        if(ret.title) my_query.fields["Job Title "+num]=ret.title;
        my_query.paste_count++;
        submit_if_done();
    }
    function autofill_fields(dontfillothers) {
        var term_map={name:"Full Name ",title:"Job Title "};
        var others=["Website URL"];
        var empty=["Linkedin Profile URL ","Twitter Profile URL "];
        var other_empty=["HQ Location","Company Email Address"];
        var i,x;
        for(i=1;i<=2;i++) {
            for(x in term_map) {
                my_query.fields[term_map[x]+i]="NA";
            }
            for(x of empty) {
                my_query.fields[x+i]="";
            }
        }
        for(x of others) my_query.fields[x]="NA";
        for(x of other_empty) my_query.fields[x]="";
        add_to_sheet();
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        var re=/Company Name:\s*(.*)/,match;
        var crowdfull=document.querySelectorAll("[name^='Full Name ']");
        var div=document.querySelector("form div");
        console.log("div.innerText="+div.innerText);
        match=div.innerText.match(re);
        var button=document.querySelector("crowd-button");
        var fuckbutton=document.createElement("input");
        fuckbutton.type="button";
        Object.assign(fuckbutton.style,{margin:"0px 100px",padding:"15px",background:"#0caf80",color:"#000000"});
        fuckbutton.value="Autofill";
        button.parentNode.insertBefore(fuckbutton,button.nextElementSibling);
        fuckbutton.addEventListener("click",autofill_fields);


        my_query={name:match[1],done:{buzzfile:false,bbb:false,linkedin:false,url:false},
                  people:[],email_list:[],paste_count:0,done:{linkedin:false,website:false,email:false,person1:false,person2:false},
                  fields:{},submitted:false,
                  try_count:{"bbb":0,"linkedin":0,email:0},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var x;
        for(x of crowdfull) {
            x.addEventListener("paste",name_paste); }
               var search_str=my_query.name+" ( CEO OR owner OR chief executive) "+"site:linkedin.com";
    /*    const linkedinPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
          //  query_search("\""+my_query.name+"\" "+reverse_state_map[my_query.state]+" site:bbb.org",resolve,reject,query_response,"bbb");
            query_search("\""+my_query.name+" site:linkedin.com/in",resolve,reject,query_response,"linkedin");
        });
        linkedinPromise.then(linkedin_promise_then)
            .catch(function(val) {
            console.log("Failed at this linkedinPromise " + val);
            my_query.done.linkedin=true;
            submit_if_done();
        });*/

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
          //  query_search("\""+my_query.name+"\" "+reverse_state_map[my_query.state]+" site:bbb.org",resolve,reject,query_response,"bbb");
            query_search("\""+my_query.name+"\"",resolve,reject,query_response,"website"); //site:icobench.com"
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.website=true;
            my_query.done.email=true;
            submit_if_done();
        });

        
    }

})();