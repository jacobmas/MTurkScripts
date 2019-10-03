// ==UserScript==
// @name         MichaelCoupe
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js

// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/adamhooper/js-priority-queue/master/priority-queue.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["facebook.com","local.yahoo.com","youtube.com","twitter.com","yelp.com",".hub.biz",".yellowbot.com","instagram.com",
                  ".youtube.com",".opendi.com",".opendi.us",".findmypilates.com","/opendatany.com",".cylex.us.com","dojos.info"];
    var MTurk=new MTurkScript(40000,500+Math.random()*500,[],init_Query,"A39GWSBSSA2V6G");
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
        if(!/facebook\.com/.test(b_url)) return true;
        if(/\/(pages|groups|search|events)\//.test(b_url)) return true;
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+",type="+type+",try_count="+my_query.try_count[type]);
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
                    if(my_query.fields.email.length===0 && my_query.fields["first name"].length>0) my_query.fields["first name"]="";
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
                   !(type==="fb" && is_bad_fb(b_url,b_name) ) && !is_bad_name(b_name,p_caption))
                {
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
        do_next_query(resolve,reject,type);
    }
    function do_next_query(resolve,reject,type) {
        var search_str;
        if(type==="yelp" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str="+\""+my_query.name.replace(/\&/g,"and")+"\" "+my_query.address+" site:yelp.com";
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        else if(type==="yelp" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str="+\""+my_query.name.replace(/\&/g,"and")+"\" "+my_query.address.replace(/,.*$/,"")+" site:yelp.com";
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        else if(type==="yelp") {
            resolve(""); return;
        }
        if(type==="fb" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str="+\""+my_query.name+"\" "+(reverse_state_map[my_query.state]?my_query.city+" "+reverse_state_map[my_query.state]:my_query.address)+" site:facebook.com";

            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        if(type==="fb" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str=my_query.name+(reverse_state_map[my_query.state]?" "+my_query.city+" "+reverse_state_map[my_query.state]:" ")+" site:facebook.com";

            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        if(type==="url" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            console.log("reverse_state_map[my_query.state]="+reverse_state_map[my_query.state]);
            search_str="+\""+my_query.name+"\" "+(reverse_state_map[my_query.state]?my_query.city+" "+reverse_state_map[my_query.state]:my_query.address);
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        if(type==="url" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            console.log("reverse_state_map[my_query.state]="+reverse_state_map[my_query.state]);

            search_str=my_query.name+(reverse_state_map[my_query.state]?" "+my_query.city+" "+reverse_state_map[my_query.state]:" "+my_query.address);
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        if(type==="url" && my_query.try_count[type]===2) {
            my_query.try_count[type]++;
            console.log("reverse_state_map[my_query.state]="+reverse_state_map[my_query.state]);
            search_str=my_query.name;
            //query_search(search_str,resolve,reject,query_response,type);
            reject("Nothing found");
            return;
        }
        reject("Nothing found");
        return;

    }

    var do_factrow=function(b_algo,b_name,b_url,p_caption) {
        var inner_li=b_algo.querySelectorAll(".b_factrow li"),i,loc_regex=/Location:\s*(.*)$/,match,parsed_add,match2,reg2,add_str;
        for(i=0;i<inner_li.length;i++) {
            if((match=inner_li[i].innerText.match(loc_regex))) {
                //console.log("match="+JSON.stringify(match));
                match[1]=match[1].replace(/[^A-Za-z0-9]+$/g,"").trim();
                //console.log("match[1]="+match[1]);
                add_str=match[1].replace(/([\d]+),\s*([A-Z]*)$/,"$2 $1").replace(/((?:Blvd|Rd|St|Dr)(\.)?)\s/,"$1,")
                .replace(/(\s(?:Blvd|Rd|St|Dr))([A-Z])/,"$1 $2");
                //console.log("add_str="+add_str);
                //console.log(/([A-Z]+)$/.test(match[1])+", "+match[1].charCodeAt(match[1].length-1));
                if(my_query.address.length===0 && (match2=match[1].match(/^([^,]*),\s*([A-Z]+)\s+([\d]+)$/))) {
                    my_query.city=match2[1];
                    my_query.state=match2[2];
                    break;
                }
               // console.log("inner_li["+i+"]="+inner_li[i].innerText+", ");
               
                if(parsed_add=new Address(add_str)) {
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
            if(name && my_query.fields["first name"].length===0 && my_query.fields.Q6MultiLineTextInput.length===0) {
                console.log("name="+name.innerText.trim());
                my_query.fields["first name"]=name.innerText.trim().split(" ")[0];
            }

        }
        resolve("");
    }

    function parse_yelp_then(result) {
        my_query.done.yelp=true;
        submit_if_done();
        if(my_query.url2) {

            var dept_regex_lst=[];

            var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
            //var promise=MTP.create_promise(
            var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
            var gov_promise=MTP.create_promise(my_query.url2,Gov.init_Gov,gov_promise_then2,function(result) {
                console.log("Failed at Gov "+result);
                my_query.done.gov2=true;
                submit_if_done(); },query);


            call_contact_page(my_query.url2,done_url2);
        }
        else {
            my_query.done.gov2=true;
            my_query.done.url2=true;
            submit_if_done();
        }
    }

    function done_url2() {
        my_query.done.url2=true;
        submit_if_done();
    }
    function yelp_promise_then(url) {
        if(url.length===0) {
            console.log("Yelp failed");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
        var base_search_str="+\""+my_query.name+"\" "+(reverse_state_map[my_query.state]?my_query.city+" "+
                                              reverse_state_map[my_query.state]:my_query.address)+" "+my_query.phone;
        if(/[A-Z][a-z]+\s+YMCA$/.test(my_query.name)) base_search_str="+\""+my_query.name+"\"";

        var yelp_promise=MTP.create_promise(url,parse_yelp,parse_yelp_then);

        var fb_str=base_search_str+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning FB search");
            query_search(fb_str, resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val);
            my_query.done.fb=true;
          
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
            console.log("Setting my_query.done.gov, query_promise_then fail");
            my_query.done.gov=true;
            my_query.done.query=true;
            submit_if_done();
            console.log("Failed at this queryPromise " + val); });

    }

    function gov_promise_then2(my_result) {
        my_query.done.gov2=true;
        after_gov(my_result,"gov_promise_then2"); }
    function gov_promise_then(my_result) {
        console.log("Setting my_query.done.gov, gov_promise_then");

        my_query.done.gov=true;
        after_gov(my_result,"gov_promise_then"); }


    function after_gov(my_result,called_from) {
        console.log("# after_gov, "+called_from);
        var i,curr,fullname,x,num;

        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
         var person_list=[];
        console.log("Gov result="+JSON.stringify(result));

         for(i=0;i<result.length;i++) {
             console.log("Before personqual");
             temp=new PersonQual(result[i],"");
             console.log("("+i+"), "+JSON.stringify(temp));
             if(temp.quality>0&&temp.email&&/@/.test(temp.email)) {
                 person_list.push(temp); }
         }
        my_query.person_list=my_query.person_list.concat(person_list);

        my_query.person_list.sort(PersonQual.cmp_people);
        console.log("Calling submit if done from gov_promise_then");
         submit_if_done();

//        console.log("result="+JSON.stringify(result));
    }

    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var all_caps_re=/^([A-Z])([A-Z\-]+)$/;
        function fix_allupper_name(match,p1,p2) {
            if(/M/.test(p1)&&p2.length>2&&/C/.test(p2[0])) {
                return p1+p2[0].toLowerCase()+p2[1]+p2.substring(2).toLowerCase(); }
            else {
                return p1+p2.toLowerCase(); }
        }
        var terms=["name","title","phone","email","url"],x;
        for(x of terms) this[x]=curr[x]?curr[x]:"na";
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name) {

            fullname=MTP.parse_name(curr.name);
            if(!fullname.fname||!fullname.lname) {
                this.quality=-1;
                return;
            }
            this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
            this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
        }x
        this.quality=0;
        if(curr.title && /Owner|General Manager|Manager|Director/i.test(curr.title)) {
            this.type="Administration";
            if(/Owner|Manager|Director/i.test(curr.title)) this.quality=3;
            else this.quality=1;
        }
        if(this.email!=="na") this.quality+=6;
        if(/[\d\?]+/.test(this.name)) this.quality=-1;
        var nlp_out=nlp(this.name).people().out('topk');
        if(nlp_out.length>0) this.quality+=2;
    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

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
        var dept_regex_lst=[];

            var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
            //var promise=MTP.create_promise(
            var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        console.log("creating promise with "+my_query.url+", Gov.init_Gov");
            var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
                console.log("Failed at Gov "+result);
//                if(my_query.fields.email.length===0) my_query.fields.email="NA";
                console.log("Setting my_query.done.gov, gov_promise fail");

                my_query.done.gov=true;
                submit_if_done(); },query);

        call_contact_page(result,submit_if_done);
    }

    function fb_promise_then(result) {
        my_query.found_fb=true;
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        console.log("creating promise with "+url+", MTP.parse_FB_about");
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields["first name"]=fullname.fname;
            my_query.fields["last name"]=fullname.lname;
        }
        if(result.email) {
            my_query.email_list.push(new EmailQual(result.email,4));
            evaluate_emails(submit_if_done);
            my_query.done.url=true;
        }
        else if(result.url && !MTP.is_bad_url(result.url,bad_urls,-1)&&!my_query.url) query_promise_then(result.url);
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(MTurk!==undefined) callback();
        else if(total_time<5000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else console.log("Failed to begin script");
    }

    function add_to_sheet() {
        var field_name_map={"email":"Email","url":"ContactInfoPage"};
        var x,field,match,nlp_match,nlp_out;
        if(my_query.fields.email.length>0||my_query.fields["first name"].length>0||my_query.fields["last name"].length>0) {
            my_query.fields.Q6MultiLineTextInput=""; }


        // Set name from email
        if(my_query.fields.email&&my_query.fields.email.length>0)  {
            console.log("*** my_query.fields.email="+my_query.fields.email);
            my_query.fields.email=my_query.fields.email.toString().replace(/^20([a-z]+)/,"$1"); }
        if(my_query.fields["first name"].length===0 && my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            nlp_out=nlp(match[1]+" "+match[2]).people().out('topk');
            console.log("nlp_out="+JSON.stringify(nlp_out));
            if(nlp_out.length>0) {
                my_query.fields["first name"]=match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
                my_query.fields["last name"]=match[2].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); });
            }
        }
        else if(my_query.fields["first name"].length===0 && my_query.fields.email.length>0 && my_query.fields["first name"].length===0 && (nlp_match=my_query.fields.email.match(/([^@]+)@/))) {
            console.log("nlp_match="+nlp_match);
            if(nlp(nlp_match[1]).people().out('topk').length>0) {
                my_query.fields["first name"]=nlp_match[1].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); }); }
        }
        my_query.fields["first name"]=my_query.fields["first name"]?my_query.fields["first name"].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); }):"";
        my_query.fields["last name"]=my_query.fields["last name"]?my_query.fields["last name"].replace(/^[a-z]{1}/,function(match) { return match.toUpperCase(); }):"";

        if(my_query.person_list.length>0&&my_query.person_list[0].email.length>0) {
          //  console.log("my_query.person_list="+JSON.stringify(my_query.person_list));
            my_query.fields["first name"]=my_query.person_list[0].first;
            my_query.fields["last name"]=my_query.person_list[0].last;
            my_query.fields.email=my_query.person_list[0].email;

        }

        for(x in my_query.fields) {
            if(document.getElementById(x) && my_query.fields[x].length>0) {
                document.getElementById(x).value=my_query.fields[x];
            }
            else if(document.getElementsByName(x).length>0) {
                document.getElementsByName(x)[0].value=my_query.fields[x];
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true;
         }
        if(my_query.done.url&&my_query.done.url2&&my_query.done.gov&&my_query.done.gov2 && !my_query.found_fb) {
            console.log("Did not find fb"); my_query.done.fb=true;
        }
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length>0 || my_query.fields.Q6MultiLineTextInput.length>0) MTurk.check_and_submit();
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
        var bad_reg_str="(ing$)|academy|location|street|schools|christian|high|rd|road|gym|family|genesis|framework|"+
            "west|east|north|south|";
        var bad_reg=new RegExp(bad_reg_str,"i");
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
               !bad_reg.test(nlp_temp[nlp_temp.length-1].normal)
               &&!bad_reg.test(nlp_temp[0].normal)
              ) {
                my_query.fields["first name"]=nlp_temp[0].text;
                my_query.fields["last name"]=nlp_temp[nlp_temp.length-1].text;
                return;
            }
        }

    
    };

    function is_bad_page(doc,title,url) {
        console.log("is_bad_page,url="+url);
        var links=doc.links,i,scripts=doc.scripts;
        var iframes=doc.querySelectorAll("iframe");
        var headers=doc.querySelectorAll("h1,h2");
        if(/^pageok/.test(doc.body.innerText)) return "dead.";
        for(i=0;i<iframes.length;i++) {
            console.log("iframes["+i+"].src="+iframes[i].src);
            if(iframes[i].src&&/parked\-content\.godaddy\.com/i.test(iframes[i].src)) {
                console.log("found bad");
                return "for sale.";
            }
        }
        if(/Default Web Site Page/.test(title)) return "dead.";

        for(i=0;i<headers.length;i++) {
            if(/^Website Coming Soon$/i.test(headers[i].innerText)) return "dead."; }
        if(/hugedomains\.com|qfind\.net|\?reqp\=1&reqr\=/.test(url)||/is for sale/.test(title)) { return "for sale."; }
        if(/hugedomains\.com|qfind\.net|\?reqp\=1&reqr\=/.test(url)) { return "for sale."; }
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
    var contact_response=function(doc,url,extra) {

        console.log("in contact_response,url="+url);
        if(/wix\.com/.test(url)) { callback(); return; }
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.email,title_result;
        if(extension===undefined) extension='';
        if(extra.extension==='' && (title_result=is_bad_page(doc,doc.title,url))) {
            console.log("Wonky bonky");
            my_query.fields.Q6MultiLineTextInput="Closed, website "+url+" is "+title_result;
            if(my_query.fields.email.length===0) {
                my_query.fields["first name"]="";
                my_query.fields["last name"]="";
            }
        }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }

        //MTP.fix_emails(doc,url);
        var headers=doc.querySelectorAll("h1,h2,h3,h4,h5,strong");
        for(i=0;i<headers.length;i++) {
           // console.log("headers["+i+"]="+headers[i].innerText);
            if(my_query.fields["first name"].length===0) {
                do_nlp(headers[i].innerText,url);
            }
        }
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".");
        MTP.fix_emails(doc,url);
        if(my_query.fields.email.length===0 && (email_matches=doc.body.innerHTML.match(email_re))) {
           // my_query.email_list=my_query.email_list.concat(email_matches);
            for(j=0; j < email_matches.length; j++) {
                my_query.email_list.push(new EmailQual(email_matches[j]));
            }
            console.log("Found email hop="+my_query.fields.email);
        }

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++) {
            if(/facebook\.com\/pages\//.test(links[i].href) &&
              (my_match=links[i].href.match(/facebook\.com\/pages\/([^\/]*)\/([^\/]*)/))) {
                links[i].href=links[i].href.replace(/(facebook\.com).*$/,"$1")+"/"+my_match[1]+"-"+my_match[2];
                console.log("# fixed links["+i+"].href="+links[i].href);
            }
            if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,AggParser.parse_instagram,parse_insta_then); }
            if(/facebook\.com\/.+/.test(links[i].href) && !MTP.is_bad_fb(links[i].href) && my_query.fb_url.length===0 &&
                !my_query.found_fb) {
                my_query.found_fb=true;
                my_query.done.fb=false;
                my_query.fb_url=links[i].href;
                fb_promise_then(links[i].href);
            }
            if(extension==='' &&
               (contact_regex.test(links[i].innerText)||/\/(contact|about)/i.test(links[i].href))
                && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)) &&
              MTurk.queryList.length<=15) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) my_query.email_list.push(new EmailQual(temp_email[0].toString()));
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
       }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        evaluate_emails(callback);
        return;
    };

    function remove_dups(lst) {
        console.log("in remove_dups,lst="+JSON.stringify(lst));
        for(var i=lst.length-1;i>0;i--) {
            if(lst[i].email.toLowerCase()===lst[i-1].email.toLowerCase() || MTP.is_bad_email(lst[i].email)) lst.splice(i,1);
        }
    }

    function EmailQual(email,quality) {
        var i;
        my_query.fullname={fname:my_query.fields["first name"]||"",lname:my_query.fields["last name"]||""};
        var fname=my_query.fullname.fname.replace(/\'/g,""),lname=my_query.fullname.lname.replace(/\'/g,"");
        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"@","i"),
             new RegExp("^"+fname+lname.charAt(0)+"@","i"),new RegExp("^"+lname+fname.charAt(0)+"@","i"),new RegExp("^"+my_query.fullname.fname+"@")];

        this.email=email;
        this.domain=email.replace(/^[^@]*@/,"");
        this.quality=0;
        if(/wix\.com/.test(this.email)) return;
        if(/^(info|contact|donations|press|admission|market|inquiries|group|member|media)/i.test(this.email)) this.quality=1;
        else if(/^(privacy)/i.test(this.email)) this.quality=-1;
        else this.quality=2;
        if(my_query.fullname.fname.length>0 && my_query.fullname.lname.length>0) {
            if(new RegExp(my_query.fullname.fname,"i").test(email)) this.quality=3;
            if(new RegExp(my_query.fullname.lname.substr(0,5),"i").test(email)) {
                this.quality=4;
                if(email.toLowerCase().indexOf(my_query.fullname.lname.replace(/\'/g,"").toLowerCase())>0 &&
                   my_query.fullname.fname.toLowerCase().charAt(0)===email.toLowerCase().charAt(0)) this.quality=5;
            }
            for(i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email)) this.quality=6;
        }
        if(this.email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.url,true)||
           this.email.replace(/^[^@]*@/,"")===MTP.get_domain_only(my_query.url2,true)) this.quality+=5;
        if(quality!==undefined) this.quality=Math.max(quality,this.quality);
        if(MTP.is_bad_email(this.email)) this.quality=-1;

    }

    EmailQual.cmp=function(a,b) {
        try {
            if(b.quality!==a.quality) return b.quality-a.quality;
            if(a.email.split("@")[1]<b.email.split("@")[1]) return -1;
            else if(a.email.split("@")[1]>b.email.split("@")[1]) return 1;
            if(a.email.split("@")[0]<b.email.split("@")[0]) return -1;
            else if(a.email.split("@")[0]>b.email.split("@")[0]) return 1;
            else return 0;
        }
        catch(error) { return 0; }
    };

    /* Evaluate the emails with respect to the name */
    function evaluate_emails(callback) {
      //  console.log("name="+JSON.stringify(my_query.fullname));
        for(i=0;i<my_query.email_list.length;i++) {
            my_query.email_list[i].email=my_query.email_list[i].email.replace(/^[^@]+\//,"").replace(/(\.[a-z]{3})yX$/,"$1"); }
        my_query.email_list.sort(EmailQual.cmp);
        remove_dups(my_query.email_list);
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        var my_email_list=[],i,curremail;
            // Judges the quality of an email
        if(my_query.email_list.length>0&&my_query.email_list[0].quality>0) {
            my_query.fields.email=my_query.email_list[0].email;
            callback();
            return true;
        }
        callback();
    }

    function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) {
             my_query.email_list.push(new EmailQual(result.email,4));
            evaluate_emails(submit_if_done);
        }
       // if(result.email&&my_query.fields.email.length===0) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        submit_if_done();
    }

    function begin_search() {
       // name_lst.push(my_query.name);
        //GM_setValue("name_lst",name_lst);
        var search_str="+\""+my_query.name+"\" "+my_query.address+" "+my_query.phone+" site:yelp.com";

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
        my_query.fields["first name"]=fullname.fname;
        my_query.fields["last name"]=fullname.lname;
        add_to_sheet();
    }

    function add_appears_closed_button() {
        var inp=document.createElement("input");
        Object.assign(inp,{type:"button",name:"appears",id:"appears",value:"Closed",style:{margin: "10px"},className:""});
        inp.style.margin="15px 50px 15px 0px";
        inp.addEventListener("click",function() {
            my_query.fields.Q6MultiLineTextInput="Appears to have closed.";
            my_query.fields.email=my_query.fields["first name"]=my_query.fields["last name"]="";
            my_query.email_list=[];
            add_to_sheet(); });
        var submit=document.querySelector("input[type='submit'");
        submit.parentNode.insertBefore(inp,submit);
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        add_appears_closed_button();

        var form=document.getElementById("mturk_form");
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,address:wT.rows[1].cells[1].innerText,city:"",state:"",
                  phone:wT.rows[2].cells[1].innerText,try_count:{url:0,fb:0,yelp:0},
                  email_list:[],url:"",url2:"",
                  person_list:[],
                  fields:{email:"","first name":"","last name":"","Q6MultiLineTextInput":""},url_list:[],
                  fb_url:"",
                  done:{fb:false,url:false,yelp:false,url2:false,query:false,gov:false,gov2:false},submitted:false};


        document.getElementById("first name").addEventListener("paste",paste_name);

        begin_script(200,0,begin_search);



    }

})();