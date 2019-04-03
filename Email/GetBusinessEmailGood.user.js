// ==UserScript==
// @name         GetBusinessEmailGood
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
                  ".youtube.com",".opendi.com",".opendi.us",".findmypilates.com","/opendatany.com",".cylex.us.com"];
    var MTurk=new MTurkScript(30000,200,[],begin_script,"AL5SB3TG7J1ZR");
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
                if(type==="url" && parsed_context.url &&
                   !MTP.is_bad_url(parsed_context.url,bad_urls,5) && (resolve(parsed_context.url)||true)) return;
            }
            console.log("MUNK");
            if(type==="url" && lgb_info && (parse_lgb=MTP.parse_lgb_info(lgb_info)) && parse_lgb.url && parse_lgb.url!==undefined  &&
              !MTP.is_bad_url(parse_lgb.url,bad_urls,5) && (resolve(parse_lgb.url)||true)) return;
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
                else if(b_url!==undefined && !(type==="url" && MTP.is_bad_url(b_url, bad_urls,4,2)) &&
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
        var base_search_str="+\""+my_query.name+"\" "+(reverse_state_map[my_query.state]?my_query.city+" "+
                                              reverse_state_map[my_query.state]:"");
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
        console.log("Found url="+result+", calling");
        if(!/http/.test(my_query.url)) {
            my_query.done.gov=false;
            my_query.url=result;
            call_contact_page(result,submit_if_done);
            var promise=MTP.create_promise(my_query.url,parse_none,gov_then,
                                                     function() { my_query.done.gov=true;
                                                                 console.log("# Calling submit_if_done, query_promise_then->parse_none fail");

                                                                 submit_if_done(); },{});
        }
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
        var field_name_map={"email":"Email","url":"ContactInfoPage"};
        var x,field,match,nlp_match,nlp_out;
        if(my_query.fields.email.length>0||my_query.fields.firstname.length>0||my_query.fields.lastname.length>0) {
            my_query.fields.Q6MultiLineTextInput=""; }

        if(my_query.fields.email&&my_query.fields.email.length>0)  {
            console.log("*** my_query.fields.email="+my_query.fields.email);
            my_query.fields.email=my_query.fields.email.toString().replace(/^20([a-z]+)/,"$1"); }
        if(my_query.fields.firstname.length===0 && my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            nlp_out=nlp(match[1]+" "+match[2]).people().out('topk');
            console.log("nlp_out="+JSON.stringify(nlp_out));
            if(nlp_out.length>0) {
                my_query.fields.firstname=match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
                my_query.fields.lastname=match[2].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
            }
        }
        else if(my_query.fields.firstname.length===0 && my_query.fields.email.length>0 && my_query.fields.firstname.length===0 && (nlp_match=my_query.fields.email.match(/([^@]+)@/))) {
            console.log("nlp_match="+nlp_match);
            if(nlp(nlp_match[1]).people().out('topk').length>0) {
                my_query.fields.firstname=nlp_match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); }); }
        }
        my_query.fields.firstname=my_query.fields.firstname.replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
        my_query.fields.lastname=my_query.fields.lastname.replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });

      /*  var bad_regex=/(^|[^A-Za-z]+)(Office|Corporate|Contact|Avenue|Street|Road|For|Of)($|[^A-Za-z]+)/i;
        var low_name=my_query.name.toLowerCase(),low_city=my_query.city.toLowerCase();
        if(my_query.fields.firstname.length>0 && my_query.fields.lastname.length>0 &&
           (low_name.indexOf(my_query.fields.firstname.toLowerCase())!==-1 || low_city.indexOf(my_query.fields.firstname.toLowerCase())!==-1||
           low_name.indexOf(my_query.fields.lastname.toLowerCase())!==-1 || low_city.indexOf(my_query.fields.lastname.toLowerCase())!==-1 ||
          bad_regex.test(my_query.fields.firstname) || bad_regex.test(my_query.fields.lastname))
          ) {
            my_query.fields.firstname="";
            my_query.fields.lastname="";
        }*/
        add_to_sheet_govt();
        do_sheet_insertion();
    }
    function do_sheet_insertion() {
        var term_map={"firstname":"First Name","email":"Email "};
        var field,x;
        console.log("my_query.fields="+JSON.stringify(my_query.fields));
        for(x in my_query.fields) {
            console.log("term_map[x]="+term_map[x]);
            if((field=document.getElementsByName(term_map[x]))&&field.length>0 && my_query.fields[x].length>0) {
                field[0].value=my_query.fields[x];
            }
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
                if(my_query.fields.firstname.length===0) document.getElementsByName("First Name")[0].value=" ";
            //    if(my_query.fields.lastname.length===0) document.getElementById("lastname").value="none";
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
        contact_response_scripts(doc,url,extra);
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }
        var headers=doc.querySelectorAll("h1,h2,h3,h4,h5,strong");
        for(i=0;i<headers.length;i++) {
           // console.log("headers["+i+"]="+headers[i].innerText);
            if(my_query.fields.firstname.length===0) {
                do_nlp(headers[i].innerText,url);

            }
        }
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
            if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done.insta===undefined) {
                my_query.done.insta=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
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
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email)) my_query.email_list.push(temp_email.toString());
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                //if(links[i].dataset) { console.log("links[i].dataset="+JSON.stringify(links[i].dataset)); }

                //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
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
        my_query.fullname={fname:my_query.fields.firstname,lname:my_query.fields.lastname};
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
            console.log("# Calling callback?=submit_if_done, evaluate_emails length>0");

            callback();
            return true;
        }
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

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var form=document.getElementById("mturk_form");
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:wT.rows[0].cells[1].innerText,try_count:{url:0,fb:0},
                  email_list:[],
                  fields:{email:"","firstname":"","lastname":""},url_list:[],
                  fb_url:"",found_fb:false,
                  done:{fb:false,url:false,query:false,gov:false},submitted:false};
        console.log("my_query.address="+my_query.address);

        if(/http/.test(my_query.url)) call_contact_page(my_query.url,done_url2);

        //  begin_searching();
        my_query.done.query=true;
        my_query.done.fb=true;
        if(/http/.test(my_query.url)) {
            var promise=MTP.create_promise(my_query.url,parse_none,gov_then,
                                           function() { my_query.done.gov=true;
                                                       console.log("# Calling submit_if_done, fall_gov_then");
                                                       submit_if_done(); },{});
        }
        else my_query.done.gov=true;
    }

})();