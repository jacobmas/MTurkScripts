// ==UserScript==
// @name         rowing dave
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  find rowing
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css

// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/app.lead411.com",".zoominfo.com",".privateschoolreview.com",".facebook.com",".niche.com","en.wikipedia.org",".yelp.com","hunter.io",
                 ".zoominfo.com","issuu.com","linkedin.com",".teamapp.com"];
    var MTurk=new MTurkScript(60000,250+Math.random()*250,[],begin_script,"A16KFUKWZFP8CS",true);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*\']{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    var Email=function(email,value) {
        this.email=email;
        this.value=value;
    };
    /* A pretty good form of is_bad_name */
    function is_bad_name(b_name,p_caption,i)
    {
        if(/ football/.test(b_name)) return true;

       
    }

    function is_bad_fb(b_url,b_name) {
        if(/\/(pages|groups|search|events)\//.test(b_url)) return true;
        return false;
    }
    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,prs;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,bb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            bb=doc.querySelector(".bm_details_overlay");
            if(/^add$/.test(type)&&bb&&bb.dataset.detailsoverlay) {
                prs=JSON.parse(bb.dataset.detailsoverlay);
                my_query.fields.latitude=prs.centerLatitude;
                my_query.fields.longitude=prs.centerLongitude;
                my_query.done.add=true;
                resolve("");
                return;
            }
            else if(/^add$/.test(type)
                   &&my_query.try_count[type]===0) {
                my_query.try_count[type]++;
                let ss=(/^P\.?O\.? BOX/i.test(my_query.add)?(my_query.name+" address"):my_query.add)
                .replace(/^[^\d]*/,"").trim();
            query_search(ss, resolve, reject, query_response,"add");
                return;
            }
            else if(/^add$/.test(type)
                   &&my_query.try_count[type]===1) {
                my_query.try_count[type]++;
                let ss=/^P\.?O\.? BOX/i.test(my_query.add)?(my_query.name+" address"):my_query.add+" map";
            query_search(ss, resolve, reject, query_response,"add");
                return;
            }
            else if(/^add$/.test(type)) {

                reject(""); return; }
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            if(parsed_context.Phone) my_query.fields.telephone=parsed_context.Phone;

                console.log("parsed_context="+JSON.stringify(parsed_context)); }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.phone) my_query.fields.telephone=parsed_lgb.phone;
                if(/query/.test(type)&&parsed_lgb.url&&!MTurkScript.prototype.is_bad_url(parsed_lgb.url, bad_urls,-1)) {
                    resolve(parsed_lgb.url);
                    return; }
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^query$/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) &&
                   ((i===0&&!MTurkScript.prototype.is_bad_url(b_url, bad_urls,3,2))||!MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i))
                   &&!is_bad_name(b_name,p_caption,i)
                   
		   && (b1_success=true)) break;
                if(i<3&&/^fb|in|tw$/.test(type) &&!is_bad_name(b_name,p_caption,i)&&
                   !(type==="tw"&&MTP.is_bad_twitter(b_url))&&
                   !(type=="in"&& /instagram\.com\/[^\/]+\/.+/.test(b_url)) &&
                   !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,1 )
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
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

        if(!my_query.fields.www) my_query.fields.www=result;
        my_query.url=my_query.fields.www;

        if(!/^http/.test(my_query.url)) my_query.url="http://"+my_query.url;
        my_query.domain=MTP.get_domain_only(my_query.url,true);
        MTurk.queryList.push(my_query.url);
        call_contact_page(my_query.url,submit_if_done);
        my_query.done.query=true;
        submit_if_done();

    }

    function fb_promise_then(result) {
        my_query.fields.facebook_url=result;
        var url=result.replace(/m\./,"www.");
        if(/\/pages\//.test(url)) url=url.replace(/(facebook\.com)\/pages\/([^\/]*)\/([^\/]*)/,"$1/pg/$2-$3");
        else url=url.replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"");
        url=url+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields.first=fullname.fname;
        }
        if(result.email) {
            my_query.fields.email=result.email;

            my_query.email_list.push(result.email);
            evaluate_emails(submit_if_done);
           /* if(!(my_query.fields.email.length>0 && /info@/.test(result.email))) {
                my_query.fields.email=result.email; }*/
            my_query.done.email=true;
        }
      if(result.url&&!my_query.fields.www&&!my_query.tried_fb) {
            my_query.tried_fb=true;
            my_query.fields.www=result.url;

            query_promise_then(result.url);
        }
        my_query.done.pfb=true;
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
         console.log("my_query.fields="+JSON.stringify(my_query.fields)+
"\nemail_list="+my_query.email_list);
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }

    }

      function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
         if(MTurk.queryList.length>0 && (MTurk.doneQueries>=MTurk.queryList.length||
                                         (my_query.fields.email.length>0 && /@/.test(my_query.fields.email)))) {
            my_query.done.email=true;

         }

        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
          if(MTurk.doneQueries<MTurk.queryList.length-1) is_done=false;
        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);

        if(is_done &&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length>0&&my_query.fields.latitude>-1000) MTurk.check_and_submit();

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
        GM_xmlhttpRequest({method: 'GET', url: url,timeout:30000,onload: function(response) {
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
        if(depth===0 && (MTP.get_domain_only(my_query.url,true)===MTP.get_domain_only(l.href,true) && /^(Terms|Privacy)/.test(l.innerText)
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
 //           console.log("inp.name="+inp.name+", inp.outerHTML="+inp.outerHTML);
            for(x in found_res) {
                if(inp.name && found_res[x].test(inp.name)) found[x]=true; }
            if(!inp.labels) continue;
            for(i=0;i<inp.labels.length;i++) {
                lbl=inp.labels[i];
                //console.log("#lbl="+lbl.innerText);
                for(x in found_res) {
                    if(found_res[x].test(lbl.innerText)) found[x]=true; }
            }
        }
   //     console.log("form "+the_form.name+", found="+JSON.stringify(found));
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
        if(/blogshot\.com|blogzet\.com/.test(url)) my_query.old_blogspot=true;
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
        var begin_email=my_query.fields.email,title_result;
        if(extension===undefined) extension='';
        if(is_bad_page(doc,doc.title,url) && MTP.get_domain_only(url,true)===my_query.domain) {
            my_query.fields.email="NA";
        }
        // Check for a contact form
        check_url_for_contact_form(doc,url);
        // check if it's an old blogspot
        check_old_blogspot(doc,url);
        if(/wix\.com/.test(url)) {
            callback();
            return; }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        MTP.fix_emails(doc,url);
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }


        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|(^\s*About)|Legal|Team|Staff|Faculty|Teacher|Coach)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        var contact2_regex=/^(Contact( Us)?)/;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".").replace(/dotcom/,".com");
        MTP.fix_emails(doc,url);
        if(my_query.fields.email.length===0 && (email_matches=doc.body.innerHTML.match(email_re))) {
            my_query.email_list=my_query.email_list.concat(email_matches);

            //console.log("Found email hop="+my_query.fields.email);
        }

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.telephone=phone_matches[0];
        for(i=0; i < links.length; i++) {
            if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done["insta"]===undefined&&
              !my_query.fields.instagram_url&&!/\.com\/nbcsportsengine/.test(links[i].href)) {
                my_query.done["insta"]=false;
                my_query.fields.instagram_url=links[i].href;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,AggParser.parse_instagram,parse_insta_then); }
             if(/facebook\.com\/.+/.test(links[i].href) && (/\/pages\//.test(links[i].href) || !MTP.is_bad_fb(links[i].href)) &&
               my_query.fb_url.length===0 && !my_query.found_fb) {
                console.log("FOUND FB");
                my_query.found_fb=true;
                my_query.done.pfb=false;
                my_query.fb_url=links[i].href.replace(/\?.*$/,"").replace(/\/pages\/([^\/]*)\/([^\/]*)/,"/$1-$2");
                fb_promise_then(my_query.fb_url);
            }
            if(/twitter\.com\//.test(links[i].href)&&!MTP.is_bad_twitter(links[i].href) && !/\.com\/sportsengine/.test(links[i].href)&&!my_query.fields.twitter_url) {
                my_query.fields.twitter_url=links[i].href;
            }
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            var depth=extension===''?0:1;
            if(good_link_to_follow(links[i],depth)
             &&
               !MTurk.queryList.includes(links[i].href) && MTurk.queryList.length<=10) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }


            if((temp_email=links[i].href.replace(/^\s*mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push(temp_email.toString());

            if(/^tel:/.test(links[i].href)) my_query.fields.telephone=links[i].href.replace(/^tel:/,"");
            //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

        }
        if(my_query.domain==="blogspot.com") do_asidelinks(doc,url,callback);
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        console.log("Calling evaluate emails from contact_response");
        evaluate_emails(callback);
        return;
    };

        /* Look at aside links on blogspot */
    function do_asidelinks(doc,url,callback) {
        var bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        let asidelinks=doc.querySelectorAll("aside .Image .widget-content a,aside .Text .widget-content a"),curr_aside;
        for(curr_aside of asidelinks) {
            if(!MTP.is_bad_url(curr_aside.href,bad_urls,5,2) && !bad_contact_regex.test(curr_aside.href) &&
               !MTurk.queryList.includes(curr_aside.href)) {
                MTurk.queryList.push(curr_aside.href);
                console.log("*** Following ASIDE link labeled "+curr_aside.innerText+" to "+curr_aside.href);
                call_contact_page(curr_aside.href,callback,"NOEXTENSION");

            }
        }
    }





    function remove_dups(lst) {

        for(var i=lst.length;i>0;i--) if(typeof(lst[i])!=="string"||(typeof(lst[i-1]==="string") &&
            lst[i].toLowerCase()===lst[i-1].toLowerCase())) lst.splice(i,1);
    }
    /* Evaluate the emails with respect to the name */
   function evaluate_emails(callback) {
      //conso
        if(my_query.email_list.length>0) {
           for(var i=0;i<my_query.email_list.length;i++) {
               if(!MTP.is_bad_email(my_query.email_list[0])&&!my_query.fields.email) {
                   my_query.fields.email=my_query.email_list[0];
                   break;
               }

            console.log("my_email_list.length>0, calling submit_if_done from evaluate_emails");
            callback();
            return true;
           }
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
    /* quality_func is a function to compute the quality of the person, defined by caller, otherwise does default */
    function PersonQual(curr,quality_func) {
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
        if(quality_func===undefined) {
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
        else this.quality=quality_func(this);
    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }
    function fb_then(r) {
        my_query.done.fb=true;
        my_query.fields.facebook_url=r;
        fb_promise_then(r);
        submit_if_done();
    }
  function tw_then(r) {
        my_query.done.tw=true;
        my_query.fields.twitter_url=r;
        submit_if_done();
    }  function in_then(r) {
        my_query.done.in=true;
        my_query.fields.instagram_url=r;
        submit_if_done();
    }
    function add_then(r) {
        my_query.done.add=true;
        submit_if_done();
    }
    function parse_usrow(doc,url,resolve,reject) {
        var strng=doc.querySelectorAll(".sfContentBlock strong");
        var x,ret;
        for(x of strng) {
            if(x.innerText.trim().length>0 && MTP.matches_names(my_query.name,x.innerText.trim())) {
                console.log("Matched "+x.innerText);
                ret=parse_usrow_entry(doc,url,x);
                resolve(ret);
                return;
            }
        }
        resolve({success:false});
    }
    function parse_usrow_entry(doc,url,x) {
        var curr=x.nextSibling;
        var status="place";
        var ret={};
        while(curr&&!(curr.nodeType===Node.ELEMENT_NODE&&curr.tagName==='STRONG')) {
            console.log("curr="+curr.textContent);
            if(curr.nodeType===Node.TEXT_NODE) {
                if(status==='place' && curr.textContent.trim().length>0) {
                    ret.place=curr.textContent.trim();
                    status='other';
                }
            }
            if(curr.nodeType===Node.ELEMENT_NODE&&curr.tagName==='A') {
                if(/@/.test(curr.href)) ret.email=curr.href.replace(/^\s*mailto:\s*/,"").replace(/^.*\//,"");
                else ret.url=curr.href;
            }
            curr=curr.nextSibling;
        }
        return ret;
    }
    function parse_usrow_then(result) {
        console.log("parse_usrow_then,result="+JSON.stringify(result));
        if(!my_query.fields.email&&result.email) my_query.fields.email=result.email;
        if(result.url) my_query.fields.www=result.url;

        my_query.done.usrowing=true;
        submit_if_done();
    }


    function init_Query() {
        console.log("in init_query");
        var i,promise,st,s;
        var match,state_zip=/([A-Z]{2}),?\s((?:[\d\-]{5,})|USA)$/;
        st=document.querySelectorAll("form strong");
        bad_urls=bad_urls.concat(default_bad_urls);
        document.querySelector("crowd-input[name='telephone']").type="text";
        my_query={name:st[1].innerText,add:st[2].innerText.replace(/\-\d{4}$/,""),fields:{email:"",latitude:-1000000},email_list:[],
                  state:"",
                  fb_url:"",insta_url:"",person_list:"",
                  done:{query:false,fb:false,email:false,tw:false,add:false,in:false,pfb:false,
                       usrowing:false},

		  try_count:{"query":0,"add":0,fb:0,tw:0,in:0},
		  submitted:false};
        if(match=my_query.add.match(state_zip)) {
            my_query.state=match[1];
            my_query.zip=match[2];
        }
        if(reverse_state_map[my_query.state]!==undefined) {
            my_query.usrow_url="http://archive.usrowing.org/domesticrowing/organizations/findaclub/findaclub"+
                reverse_state_map[my_query.state].toLowerCase().replace(/\s/g,"");
            var rowPromise=MTP.create_promise(my_query.usrow_url,parse_usrow,parse_usrow_then);
        }
        else my_query.done.usrowing=false;
        my_query.s_name=MTP.shorten_company_name(my_query.name);
        my_query.add=my_query.add.replace(my_query.s_name,"").replace(/^.*?Attn:/,"").trim();
        console.log("my_query="+JSON.stringify(my_query));

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" rowing "+my_query.add, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=my_query.done.email=true;
            submit_if_done();
        });
        const addPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            let ss=my_query.add.replace(/^P\.?O\.? BOX\s[A-Z0-9]+\s/i,"").trim();
            query_search(ss, resolve, reject, query_response,"add");
        });
        addPromise.then(add_then)
            .catch(function(val) {
            console.log("Failed at this addPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true);
            submit_if_done();
        });
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" rowing "+ " site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.fb=my_query.done.pfb=true; submit_if_done();
        });
        const inPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" rowing "+ " site:instagram.com", resolve, reject, query_response,"in");
        });
        inPromise.then(in_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.in=true; submit_if_done();
        });
        const twPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" rowing "+ " site:twitter.com", resolve, reject, query_response,"tw");
        });
        twPromise.then(tw_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.tw=true; submit_if_done();
        });

    }


   

})();