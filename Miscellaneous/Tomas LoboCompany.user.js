// ==UserScript==
// @name         Tomas LoboCompany
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[".eleconomista.es",".paginasamarillas.es",".pymes.com",".universia.es"];
    var MTurk=new MTurkScript(40000,750+(Math.random()*1000),[],begin_script,"A4PXU10RT5F5B",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i) {
        function is_bad_name_replacer(match,p1,p2,p3) {
            if(/Saint/i.test(p2)) return p1+"St"+p3;
            else return p1+"Mt"+p3;
        }


        var orig_b_name=MTP.shorten_company_name(b_name.replace(/\s-\s.*$/,""));
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                        is_bad_name_replacer);
        my_query.name=my_query.name.replace("’","\'").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                              is_bad_name_replacer);
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
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+",type="+type);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Phone) my_query.fields.company_phone=parsed_context.Phone;
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^query$/.test(type) && !MTP.is_bad_url(b_url, bad_urls,4,2) &&
                   !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
                if(/^(einforma)$/.test(type) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
                if(/^(eleconomista)$/.test(type) &&  /empresite\./.test(b_url) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;

            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        var ext_map={"query":"","einforma":" site:einforma.com"};

        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let ext=ext_map[type];
            query_search(my_query.name+ext, resolve, reject, query_response,type);
            return;
        }
        reject("Nothing found");
        return;
    }

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

        /* If it's a good link to follow in the search for emails */
    function good_link_to_follow(l,depth) {
        var contact_regex=/(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/(^\s*(javascript|mailto|tel):)|(\.pdf$)/i;
        var contact2_regex=/^(Contact( Us)?)/;

        if(depth===0 && ((contact_regex.test(l.innerText)||/\/(contact)/i.test(l.href))
                && !bad_contact_regex.test(l.href))) return true;
        if(depth===0 && (MTP.get_domain_only(my_query.fields.company_url||"",true)===MTP.get_domain_only(l.href,true) && /^(Terms|Privacy)/.test(l.innerText)
           && !bad_contact_regex.test(l.href))) return true;
      //  if(depth>0 && contact2_regex.test(l.innerText) && !bad_contact_regex.test(l.href)) return true;
     //   console.log("l.innerText="+l.innerText);
        return false;
    }

    function is_contact_form(the_form) {
        var found={"name":false,"email":false,"phone":false,"message":false};
        // regexs to link to founds
        var found_res={"name":/Name|(^First$)|(^Last$)/i,"email":/E(-)?mail/i,"phone":/Phone/i,"message":/Message|Comments|Details/i};
        var inp,lbl,i;
        var ct=0,x;
        if(the_form.className.match(/contact-form|contactform/)) return true;
        for(inp of the_form.querySelectorAll("input,textarea")) {
            console.log("inp.name="+inp.name+", inp.outerHTML="+inp.outerHTML);
            for(x in found_res) {
                if(inp.name && found_res[x].test(inp.name)) found[x]=true; }
            if(!inp.labels) continue;
            for(i=0;i<inp.labels.length;i++) {
                lbl=inp.labels[i];
                console.log("#lbl="+lbl.innerText);
                for(x in found_res) {
                    if(found_res[x].test(lbl.innerText)) found[x]=true; }
            }
        }
        console.log("form "+the_form.name+", found="+JSON.stringify(found));
        /* Check for 3 of 4 */
        for(x in found) if(found[x]) ct++;
        return ct>=3;
    }

    function check_url_for_contact_form(doc,url) {
        console.log("In check_url_for_contact_form, url="+url);
        var form=doc.querySelectorAll("form"),btn;
        if((btn=doc.querySelector("button.g-recaptcha")) && (btn.innerText==="Submit")) my_query.contact_url=url;
        //if(!/\/contact/.test(url)) return;
        form.forEach(function(elem) {
            console.log("\tcheck_url_for_contact_form, form id="+elem.id+", name="+elem.name);
            if(is_contact_form(elem)&&(my_query.domain===MTP.get_domain_only(url,true))) my_query.contact_url=url;
        });

//        if(submit) my_query.contact_url=url;
    }
    // Fix in case it gets older, also make into a library
    function check_old_blogspot(doc,url) {
        var datehead,year;
        url=url.replace(/\/$/,"");
        console.log("check_old_blogspot, url="+url);
        if(!/blogspot\.com$/.test(url)) return;
        datehead=doc.querySelector(".date-header");
        if(datehead && (year=parseInt(datehead.innerText.trim().match(/[\d]{4,}$/)))) {
            console.log("check_old_blogspot, year="+year);
            if(year<2019) my_query.old_blogspot=true;
        }
    }

    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);

        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.company_email,title_result;
        if(extension===undefined) extension='';
        // Check for a contact form
       // check_url_for_contact_form(doc,url);
        // check if it's an old blogspot
        //check_old_blogspot(doc,url);
        if(/wix\.com/.test(url)) {
            callback();
            return; }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        MTP.fix_emails(doc,url);
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }


        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        var contact2_regex=/^(Contact( Us)?)/;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".").replace(/dotcom/,".com");
        MTP.fix_emails(doc,url);
        if((email_matches=doc.body.innerHTML.match(email_re))) {
            my_query.email_list=my_query.email_list.concat(email_matches);

            //console.log("Found email hop="+my_query.fields.email);
        }

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {

            //console.log("i="+i+", text="+links[i].innerText);
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            var depth=extension===''?0:1;
            if(good_link_to_follow(links[i],depth)
             &&
               !MTurk.queryList.includes(links[i].href)) {
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
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.email_list.push(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

        }

        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        console.log("Calling evaluate emails from contact_response");
        evaluate_emails(callback);
        return;
    };
    function remove_dups(lst) {
        console.log("in remove_dups,lst="+JSON.stringify(lst));
        for(var i=lst.length;i>0;i--) {
            if(typeof(lst[i])!=="string"||(typeof(lst[i-1]==="string") &&
            lst[i].toLowerCase()===lst[i-1].toLowerCase())) lst.splice(i,1);
        }
    }
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

        // Judges the quality of an email
        function EmailQual(email) {
            this.email=email.replace(/^20/,"").replace(/^\!\-\-/,"");
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            if(/wix\.com/.test(this.email)) return;

            if(/^(info|contact|admission|market|cancel|support|customersupport|feedback)/.test(email)) this.quality=1;
            else this.quality=2;

            if(this.email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.fields.company_url||"",true)) this.quality+=5;
            if(/^(abuse|privacy|DMCA)/i.test(this.email)) this.quality=-1;
            if(/noreply@blogger.com/.test(this.email)) this.quality=-1;

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
            my_query.fields.company_email=my_email_list[0].email;
            console.log("my_email_list.length>0, calling submit_if_done from evaluate_emails");
            callback();
            return true;
        }
        console.log("my_email_list.length=0, calling submit_if_done from evaluate_emails");

        callback();
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.done.query=true;
        console.log("query_promise_then,result="+result);
        my_query.fields.company_url=result;
        add_to_sheet();
        call_contact_page(my_query.fields.company_url,submit_if_done);
    }

    function einforma_promise_then(result) {
        console.log("einforma_promise_then,result="+result);
        var promise=MTP.create_promise(result,parse_einforma,parse_result_then,function() {
            console.log("Failed einforma");
            GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }
    function parse_einforma(doc,url,resolve,reject) {
        var tel=doc.querySelector("#myTelephone"),sic=doc.querySelector("[itemprop='isicV4']");
        var match;
        if(tel) my_query.fields.company_phone=tel.innerText.trim();
        if(sic) console.log("sic="+sic.innerText);
        if(sic && (match=sic.innerText.trim().match(/^[\d]+/))) my_query.fields.company_sic=match[0];
        resolve("einforma");

    }

    function parse_result_then(result) {
        my_query.done[result]=true;
        submit_if_done();
    }

    function eleconomista_promise_then(result) {
        console.log("eleconomista_promise_then,result="+result);
        my_query.eleconomista_url=result;
        var promise=MTP.create_promise(my_query.eleconomista_url,parse_eleconomista,parse_result_then,function() {
            console.log("Failed eleconomista");
            my_query.done.eleconomista=true;
            submit_if_done();
        });
    }

    function parse_eleconomista(doc,url,resolve,reject) {
        var tel=doc.querySelector("[itemprop='telephone']"),email=doc.querySelector(".email");
        var website=doc.querySelector(".website a");
        if(tel) my_query.fields.company_phone=tel.innerText.trim();
        if(email) my_query.fields.company_email=email.innerText.trim();
        if(website && !my_query.fields.company_url) my_query.fields.company_url=website.href;
        resolve("eleconomista");
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
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_finished_fields=true;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true; }
        console.log("submit_if_done,my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.company_url.length===0) {
                var domain=my_query.fields.company_email.replace(/^[^@]*@/,"");
                if(domain.length>0 && !/^(yahoo|gmail)/.test(domain)) my_query.fields.company_url="http://www."+domain;
                add_to_sheet();
            }
            for(x in my_query.fields) {
                if(my_query.fields[x].length===0) is_finished_fields=false; }
            if(is_finished_fields) MTurk.check_and_submit();
            else {
                console.log("Missing fields, returning, "+JSON.stringify(my_query.fields));
                GM_setValue("returnHit"+MTurk.assignment_id,true);
            }

        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={company_name:wT.rows[0].cells[1].innerText,city:wT.rows[1].cells[1].innerText,
                  NIF:wT.rows[2].cells[1].innerText,fb_url:"",
                  fields:{company_url:"",company_phone:"",company_email:"",company_sic:""},email_list:[],
                  done:{query:false,einforma:false,eleconomista:false,url:false},
                  try_count:{query:0,einforma:0},
                  submitted:false};
        my_query.name=MTP.shorten_company_name(my_query.company_name.replace(/,.*$/,"").trim().replace(/\s*S\.?L\.?U\.?\s*$/,"").
        replace(/\s*S\.?L\.?\s*$/,"").trim());
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.company_name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.query=true;
            my_query.done.url=true;
            submit_if_done();
            });
        const einformaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:einforma.com", resolve, reject, query_response,"einforma");
        });
        einformaPromise.then(einforma_promise_then)
            .catch(function(val) {
            console.log("Failed at this einformaPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        const eleconomistaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:eleconomista.es", resolve, reject, query_response,"eleconomista");
        });
        eleconomistaPromise.then(eleconomista_promise_then)
            .catch(function(val) {
            console.log("Failed at this eleconomistaPromise " + val); my_query.done.eleconomista=true;
            submit_if_done();
        });
    }

})();
