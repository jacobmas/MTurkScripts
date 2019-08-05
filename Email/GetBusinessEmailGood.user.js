// ==UserScript==
// @name         GetBusinessEmailGoodNameOnly
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
// @grant GM_deleteValue
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/adamhooper/js-priority-queue/master/priority-queue.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["facebook.com","local.yahoo.com","youtube.com","twitter.com","yelp.com",".hub.biz",".yellowbot.com","instagram.com",
                  ".youtube.com",".opendi.com",".opendi.us",".findmypilates.com","/opendatany.com",".cylex.us.com","mapquest.com"];
    var MTurk=new MTurkScript(30000,200,[],begin_script,"A3OYFBE0003XYH",true);
    var MTP=MTurkScript.prototype;

    var name_lst=GM_getValue("name_lst",[]);

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

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,search_str;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,parsed_add;
        var b1_success=false, b_header_search,b_context,parsed_context,parse_lgb,loc_hy,parsed_loc;
        var max_i;
        if(type==="url") max_i=5;
        else max_i=3;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            loc_hy=doc.getElementById("loc_hy");
            if(b_context && (parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.Address && (parsed_add=parseAddress.parseLocation(parsed_context.Address))) {
                    console.log("Success address: "+JSON.stringify(parsed_add));
                    my_query.city=parsed_add.city?parsed_add.city:"";
                    my_query.state=parsed_add.state?parsed_add.state:"";
                }
                if(doc.getElementById("permanentlyClosedIcon")) {
                    my_query.fields.Q6MultiLineTextInput="Permanently closed";
                    if(my_query.fields.email.length===0 && my_query.fields.firstname.length>0) my_query.fields.firstname="";
                }
                if(/url|query/.test(type) && parsed_context.url &&
                   !MTP.is_bad_url(parsed_context.url,bad_urls,4,2) && (resolve(parsed_context.url)||true)) return;
            }
            console.log("MUNK");
            if(type==="url" && lgb_info && (parse_lgb=MTP.parse_lgb_info(lgb_info)) && parse_lgb.url && parse_lgb.url!==undefined  &&
              !MTP.is_bad_url(parse_lgb.url,bad_urls,4,2) && (resolve(parse_lgb.url)||true)) return;
            try {
                if(type==="url" && loc_hy && (parsed_loc=MTP.parse_loc_hy(loc_hy))) {
                    console.log("# parsed_loc="+JSON.stringify(parsed_loc));
                }
            }
            catch(error) { console.log("Error with parse_loc_Hy="+error); }
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length && i < max_i; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(type+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="yelp") {
                    do_factrow(b_algo[i],b_name,b_url,p_caption);
                    resolve(b_url);
                    return;
                }
                else if(b_url!==undefined && !(/url|query/.test(type) && MTP.is_bad_url(b_url, bad_urls,4,2)) &&
                   !(type==="fb" && is_bad_fb(b_url,b_name)) && !is_bad_name(b_name,p_caption)) {
                    b1_success=true;
                    break;
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(do_next_query_for_type(response,resolve,reject,type)) return true;
        reject("Nothing found");
        return;
    }
    function do_next_query_for_type(response,resolve,reject,type) {
        var search_str;
        var name_str=my_query.try_count[type]===0?"+\""+my_query.name+"\"":my_query.name;
        var city_state=(reverse_state_map[my_query.state]?my_query.city+" "+reverse_state_map[my_query.state]:"");
        if(type==="yelp"&&(resolve("")||true)) return true;
        if(/^(fb|url)$/.test(type) && my_query.try_count[type]<2) {
            search_str=name_str+" "+city_state+(/^fb$/.test(type)?" site:facebook.com":"");
            my_query.try_count[type]++;
            query_search(search_str,resolve,reject,query_response,type);
            return true;
        }
        return false;
    }

    var do_factrow=function(b_algo,b_name,b_url,p_caption) {
        var inner_li=b_algo.querySelectorAll(".b_factrow li"),i,loc_regex=/Location:\s*(.*)$/,match,parsed_add,match2,reg2,add_str;
        for(i=0;i<inner_li.length;i++) {
            if((match=inner_li[i].innerText.match(loc_regex))) {
                //console.log("match="+JSON.stringify(match));
                match[1]=match[1].replace(/[^A-Za-z0-9]+$/g,"").trim();
                //console.log("match[1]="+match[1]);
                add_str=match[1].replace(/([\d]+),\s*([A-Z]*)$/,"$2 $1").replace(/((?:Blvd|Rd|St|Dr)(\.)?)\s/,"$1,");
                //console.log("add_str="+add_str);
                //console.log(/([A-Z]+)$/.test(match[1])+", "+match[1].charCodeAt(match[1].length-1));

                if(my_query.address.length===0 && (match2=match[1].match(/^([^,]*),\s*([A-Z]+)\s+([\d]+)$/))) {
                    my_query.city=match2[1];
                    my_query.state=match2[2];
                    break;
                }
               // console.log("inner_li["+i+"]="+inner_li[i].innerText+", ");

                if(parsed_add=parseAddress.parseLocation(add_str)) {
                    my_query.city=parsed_add.city?parsed_add.city:"";
                    my_query.state=parsed_add.state?parsed_add.state:"";
                console.log("my_query.city="+my_query.city);
                }
            }

        }
    };

    function parse_yelp(doc,url,resolve,reject) {
        var a=doc.querySelector(".biz-website a"),main=doc.querySelector(".from-the-business-main"),name;
        if(a) {
            //console.log("parse_yelp,a="+a);
            let match=a.href.match(/\?url\=([^&]+)/);
            // console.log("match="+JSON.stringify(match));
            my_query.url2=decodeURIComponent(match[1]);
            console.log("my_query.url2="+my_query.url2);
        }
        if(main) {
           //console.log("main.innerHTML="+main.innerHTML);
            name=main.querySelector(".user-display-name");
            if(name && my_query.fields.firstname.length===0 && my_query.fields.Q6MultiLineTextInput.length===0) {
                console.log("name="+name.innerText.trim());
                my_query.fields.firstname=name.innerText.trim().split(" ")[0];
            }

        }
        resolve("");
    }

    function parse_yelp_then(result) {
        my_query.done.yelp=true;
        console.log("# Calling submit_if_done, parse_yelp_then1");

        submit_if_done();
        if(my_query.url2) call_contact_page(my_query.url2,done_url2);
        else if((my_query.done.url2=true)) {
            console.log("# Calling submit_if_done, parse_yelp_then2");

            submit_if_done();
        }
    }

    function done_url2()
    {
        my_query.done.url2=true;
        console.log("# Calling submit_if_done, done_url2");
        submit_if_done();
    }
    function begin_searching() {
        var base_search_str="+\""+my_query.name+"\" "+(reverse_state_map[my_query.state]||"");
        if(/[A-Z][a-z]+\s+YMCA$/.test(my_query.name)) base_search_str="+\""+my_query.name+"\"";
        var fb_str=base_search_str+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning FB search");
            query_search(fb_str, resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val);
            my_query.done.fb=true;
             console.log("# Calling submit_if_done, fbPromise fail");
            submit_if_done();
        });
        var search_str=base_search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {

            my_query.done.url=true;
            my_query.done.query=true;
             console.log("# Calling submit_if_done, queryPromise fail");

            submit_if_done();
            console.log("Failed at this queryPromise " + val); });

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
        my_query.url=result;
        console.log("Found url="+result+", calling");
       
        my_query.done.gov=true;
        my_query.url=result;
        call_contact_page(result,submit_if_done);

         console.log("# Calling submit_if_done, query_promise_then");

        submit_if_done();



    }

    function fb_promise_then(result) {

        my_query.found_fb=true;
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);
    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields.firstname=fullname.fname;
            my_query.fields.lastname=fullname.lname;
        }
        if(result.email) {
            my_query.email_list.push(result.email);
            evaluate_emails(submit_if_done);
           /* if(!(my_query.fields.email.length>0 && /info@/.test(result.email))) {
                my_query.fields.email=result.email; }*/
            my_query.done.url=true;
        }

        else if(result.url && !MTP.is_bad_url(result.url,bad_urls,-1) && !/http/.test(my_query.url) &&
               (my_query.url=result.url)) query_promise_then(my_query.url);
        console.log("# Calling submit_if_done, parse_fb_about_then");
        my_query.done.fb=true;
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
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function GovQual(curr) {
        var x;

        for(x in curr) this[x]=curr[x];
        if(!this.name||!this.email) {
            this.quality=-1;
            return;
        }
        var nlp_out=nlp(this.name).people().out('topk');

        this.fullname=MTP.parse_name(this.name);
        var fname=this.fullname.fname,lname=this.fullname.lname;
        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];

        this.domain=this.email.replace(/^[^@]*@/,"");
        this.quality=0;
        if(/wix\.com/.test(this.email)) return;
        if(/^(info|contact|admission|market)/.test(this.email)) this.quality=1;
        else this.quality=2;
        if(new RegExp(this.fullname.fname,"i").test(this.email)) this.quality=3;
        if(new RegExp(this.fullname.lname.substr(0,5),"i").test(this.email)) {
            this.quality=4;
            if(this.email.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
               my_query.fullname.fname.toLowerCase().charAt(0)===this.email.toLowerCase().charAt(0)) this.quality=5;
        }
        for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(this.email)) this.quality=6;
        if(this.email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.url,true)) this.quality+=4;
        if(this.title && /(^|[^A-Za-z]+)(President|CEO|Chief Executive|Marketing|Owner)($|[^A-Za-z]+)/.test(this.title)) this.quality+=6;
        else if(this.title && /(^|[^A-Za-z]+)(Director|Manager)($|[^A-Za-z]+)/.test(this.title)) this.quality+=3;
        if(nlp_out.length===0) this.quality-=10;

    }
    GovQual.cmp=function(g1,g2) {
        if(!(g1 instanceof GovQual && g2 instanceof GovQual)) return 0;

        return g2.quality-g1.quality;
    };

    function add_to_sheet_govt() {
        var i,qual_list=[];
        for(i=0;i<Gov.contact_list.length;i++) {
            if(Gov.contact_list[i].name && !/[\d]+/.test(Gov.contact_list[i].name)) {
                qual_list.push(new GovQual(Gov.contact_list[i]));
            }
        }
        qual_list.sort(GovQual.cmp);
        if(qual_list.length>=1 && qual_list[0].quality>=6) {
            console.log("Found qual_list"+JSON.stringify(qual_list[0]));
            my_query.fields.email=qual_list[0].email;
            my_query.fields.firstname=qual_list[0].fullname.fname;
            my_query.fields.lastname=qual_list[0].fullname.lname;

        }
        else if(qual_list.length>=1) {
            console.log("### Found bad qual_list"+JSON.stringify(qual_list[0])); }
    }


    function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true; }
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true) && (MTurk.submitted=true)) {
            if(my_query.fields.email.length>0) {
              
                MTurk.check_and_submit(); }
            else {
                console.log("Insufficient info found, returning");
                GM_setValue("returnHit"+MTurk.assignment_id,true);
                return;
            }
        }
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
                               console.log("# Calling callback?=submit_if_done, onerror in call_contact_page");

                               callback();
                           },
                           ontimeout: function(response) {
                               console.log("Fail timeout");
                               MTurk.doneQueries++;
                               console.log("# Calling callback?=submit_if_done, ontimeout in call_contact_page");

                               callback(); }
                          });
    };

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
               &&!/location|street|christian|high|west|east|north|south/.test(nlp_temp[0].normal)
              ) {
                my_query.fields.firstname=nlp_temp[0].text;
                my_query.fields.lastname=nlp_temp[nlp_temp.length-1].text;
                return;
            }
        }


    };

  
    function is_bad_page(doc,title,url) {
        var links=doc.links,i,scripts=doc.scripts;
        if(/hugedomains\.com/.test(url)) { return "for sale."; }
        else if(/Expired|^404|Error/.test(title)) return "dead.";
    //    else if(doc.body.innerHTML.length<500) return " apparently empty.";
      /*  else if(MTP.is_bad_url(url,bad_urls,4) && !((
            my_query.url===undefined ||
            MTP.get_domain_only(my_query.url,true)!==MTP.get_domain_only(url,true)) && (my_query.url2===undefined||
                                   MTP.get_domain_only(my_query.url2,true)!==MTP.get_domain_only(url,true)))) {
            return "dead/hijacked.";
        }
        else if(my_query.url2) {
            console.log("# DOMAIN "+MTP.get_domain_only(my_query.url2,true)+", "+MTP.get_domain_only(url,true)); }*/
        return null;
    }


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {

        console.log("in contact_response,url="+url);
        if(/wix\.com/.test(url)) {
            callback();
            return; }
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.email,title_result;
        if(extension===undefined) extension='';
        if(extra.extension==='' && (title_result=is_bad_page(doc,doc.title,url))) {
            my_query.fields.Q6MultiLineTextInput="Closed, website "+url+" is "+title_result;
            if(my_query.fields.email.length===0 && my_query.fields.firstname.length>0) my_query.fields.firstname="";
        }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        MTP.fix_emails(doc,url);
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }
        
        //console.log(url+": "+JSON.stringify(nlp_temp));
//        console.log(nlp_temp);
        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(^About)|(Contact|Legal|Team|Staff|Faculty|Teacher|People|Leadership)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".");
        MTP.fix_emails(doc,url);
        if(my_query.fields.email.length===0 && (email_matches=doc.body.innerHTML.match(email_re))) {
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
           
            if(/facebook\.com\/.+/.test(links[i].href) && !MTP.is_bad_fb(links[i].href) &&
               my_query.fb_url.length===0 && !my_query.found_fb) {
                my_query.found_fb=true;
                console.log("# CALLING fb again");
                my_query.done.fb=false;
                my_query.fb_url=links[i].href;
                fb_promise_then(links[i].href);
            }

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
               !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push(temp_email[0]);

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;

        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
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
        //console.log("DUNK");
        my_query.fullname={fname:my_query.fields.firstname,lname:my_query.fields.lastname};
        //console.log("DUNK2");

        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");
        //console.log("DUNK3");

        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];
             //   console.log("DUNK4");

        // Judges the quality of an email
        function EmailQual(email) {
            this.email=email;
           // console.log("DUNK7.5,"+email);

            try {
                this.domain=email.replace(/^[^@]*@/,"");
            }
            catch(error) { console.log("failed on email replace"); }
            this.quality=0;
            if(/wix\.com/.test(this.email)) return;
            if(/^(info|contact|admission|market)/.test(email)) this.quality=1;
            else this.quality=2;
            if(new RegExp(my_query.fullname.fname,"i").test(email)) this.quality=3;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email)) {
                this.quality=4;
                
            }
           // console.log("DUNK8,"+email+", this.email="+this.email);

            for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=6;
            try {
                if(email&&email.length>0 && email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.url,true)) this.quality+=5;
            }
            catch(error) { console.log("error"); }
         //  console.log("DUNK9,"+email);
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
            console.log("# Calling callback?=submit_if_done, evaluate_emails length>0");

            callback();
            return true;
        }
                        console.log("DUNK7");

        console.log("# Calling callback?=submit_if_done, evaluate_emails otherwise");
        callback();
    }

    function parse_insta_then(result) {
        let match;
        if(result.biography && (match=result.biography.match(email_re)) && !result.email) result.email=match[0];
        console.log("insta_result="+JSON.stringify(result));

        if(result.email) {
             my_query.email_list.push(result.email);
            evaluate_emails(submit_if_done);
        }
       // if(result.email&&my_query.fields.email.length===0) { my_query.fields.email=result.email; }
        my_query.done.insta=true;
        console.log("# Calling submit_if_done, parse_insta_then");
        submit_if_done();
    }

    function begin_search() {
       // name_lst.push(my_query.name);
        //GM_setValue("name_lst",name_lst);
        var search_str="+\""+my_query.name+"\" "+""+" "+my_query.phone+" site:yelp.com";

        const yelpPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"yelp");
        });
        yelpPromise.then(yelp_promise_then)
            .catch(function(val) {


            console.log("Failed at this yelpPromise " + val); });

    }
    function paste_name(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        var fullname=MTP.parse_name(text);
        my_query.fields.firstname=fullname.fname;
        my_query.fields.lastname=fullname.lname;
        add_to_sheet();
    }

    function gov_then() {
        my_query.done.gov=true;
        var i;
        for(i=0;i<Gov.contact_list.length;i++) {
            console.log("Gov.contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i])); }
        console.log("# Calling submit_if_done, gov_then");

        submit_if_done();
    }
    var is_bad_link=function(url) {
        url=url.toLowerCase();
        if(/^mailto|javascript|tel/.test(url)||/\.pdf([^a-z]+|$)/.test(url)) return true;
        return false;
    };
    var parse_none=function(doc,url,resolve,reject,self) {
        var promise_list=[],i,links=doc.links,query_list=[],schoolphone,phone;
        console.log("Beginning parse_none");
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            //console.log("links["+i+"].innerText="+links[i].innerText+", href="+links[i].href);
            if(MTP.get_domain_only(links[i].href,true)===MTP.get_domain_only(url,true) && query_list.length<12&&
                 /(^(Admin|District))|Contact|Directory|Staff|About|Leadership|Team|Management/i.test(links[i].innerText) && !is_bad_link(links[i].href)
              && !query_list.includes(links[i].href)
              ) {
                query_list.push(links[i].href);
                promise_list.push(MTP.create_promise(links[i].href,Gov.load_scripts,MTP.my_then_func,
                                                     MTP.my_catch_func,{})); }
        }
        //console.log("query_list="+JSON.stringify(query_list));
        Promise.all(promise_list).then(function(ret) {
            let i,curr,match;
            for(i=0;i<Gov.contact_list.length;i++) {
                curr=Gov.contact_list[i];
                console.log("Gov.contact_list["+i+"]="+JSON.stringify(curr));

            }
            resolve(self);
        }).catch(function(error) {
            console.log("Error: "+error); });
    };

    function init_Query() {
        console.log("in init_query");
        var i;
        var re=/^([^,]*),\s*(.*)$/,match;
        bad_urls=bad_urls.concat(default_bad_urls);
        var form=document.getElementById("mturk_form");
       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var fullnamestuff=document.querySelector("form div a").innerText;
        match=fullnamestuff.match(re);
        my_query={name:match[1],address:match[2],try_count:{url:0,fb:0,query:0},
                  email_list:[],
                  fields:{email:"",firstname:"",lastname:""},url_list:[],
                  fb_url:"",found_fb:false,
                  done:{fb:false,url:false,query:false,gov:true},submitted:false};

        my_query.parsedAdd=parseAddress.parseLocation(my_query.address);
        my_query.state=my_query.parsedAdd.state||"";
        console.log("my_query="+JSON.stringify(my_query));

        begin_searching();
/*        var search_str=my_query.name+" "+(reverse_state_map[my_query.parsedAdd.state]||"");
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });*/

       
        
    }

})();