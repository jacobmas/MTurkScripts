// ==UserScript==
// @name         FindPersonalEmailMicaelaMathre
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Micaela Mathre. Does not try to guess the email address from the name, so that should be updated
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
    var MTurk=new MTurkScript(60000,200,[],begin_script,"A3BKMJI0GSMC97",false);
    var MTP=MTurkScript.prototype;

    //var name_lst=GM_getValue("name_lst",[]);

    var Email=function(email,value) {
        this.email=email;
        this.value=value;
    };
    var College={};

    /* A pretty good form of is_bad_name */
    function is_bad_name(b_name,p_caption,i)  {
        return false;
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.company.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
       // my_query.name=my_query.name.replace("’","\'");
//        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.company)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.company.split(" ")[0].toLowerCase())!==-1) return false;
        return true;
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
                if(parsed_context.Phone) my_query.collegephone=parsed_context.Phone;
                if(/^domain_query$/.test(type) &&
                   parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,4) && resolve(parsed_context.url||true)) return;
            }
          /*  if(type==="url" && lgb_info && (parse_lgb=MTP.parse_lgb_info(lgb_info)) && parse_lgb.url && parse_lgb.url!==undefined  &&
              !MTP.is_bad_url(parse_lgb.url,bad_urls,5) && (resolve(parse_lgb.url)||true)) return;*/
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
                if(/domain_query/.test(type) && !MTP.is_bad_url(b_url,bad_urls,4,2) && !is_bad_name(b_name,p_caption,i) &&
                   (b1_success=true)) break;
                 if(/directory/.test(type) && !MTP.is_bad_url(b_url,bad_urls,5,2) && !is_bad_name(b_name,p_caption,i) &&
                   (b1_success=true)) break;
                if(type==="gov" && !MTP.is_bad_url(b_url,bad_urls,-1)) {
                    my_query.gov_promise_list.push(MTP.create_promise(b_url,parse_none,MTP.my_try_func,
                                                     MTP.my_catch_func,{})); }

            }
            if(type!=='gov' && b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type!=='gov') reject("Nothing found");
        else if(type==='gov' && my_query.gov_promise_list.length===0 && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(my_query.first+" "+my_query.last+" "+my_query.company, resolve, reject, query_response,"gov");
            return;
        }
        else {
            Promise.all(my_query.gov_promise_list).then(function() { resolve(""); })
            .catch(function(response) {
                console.log("Error in promises, response="+response);
                my_query.done.gov=true;
                submit_if_done();
            });
        }
        return;

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
        my_query.done.domain_query=true;
        my_query.domain=MTP.get_domain_only(result,true);
          var search_str=my_query.first+" "+my_query.last+" site:"+my_query.domain;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning person search");
            query_search(search_str, resolve, reject, query_response,"gov");
        });
        queryPromise.then(gov_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

    }
    function directory_then(result) {
        my_query.done.directory=true;
        submit_if_done();
    }
    function directory_catch(response) {
         my_query.done.directory=true;
        console.log("Failed at directory query "+response);
        submit_if_done();
    }
    function dir_promise_then(result) {
       // my_query.done.directory=true;
        my_query.directory_url=result;
        console.log("Found directory url="+my_query.directory_url);
        var college_query={"first":my_query.first,"last":my_query.last};
        var promise=MTP.create_promise(my_query.directory_url,College.query_directory,directory_then,directory_catch,college_query);
    }

    College.query_directory=function(doc,url,resolve,reject,college_query) {
        College.query=college_query;
        var i;
        var text_input=doc.querySelector("form input[type='text']");
        if(!text_input && (resolve("")||true)) return;
        // TODO: differentiate first and last
        text_input.value=college_query.first+" "+college_query.last;
        var form=text_input.form;

        var submit_input=text_input.form.querySelector("input[type='submit'],button");
        console.log("text_input="+text_input+", submit_input="+submit_input);
        var base_url=url.replace(/^(https?:\/\/[^\/]+).*$/,"$1");
        var query_url=MTP.fix_remote_url(form.action,url);
        console.log("* query_url="+query_url);
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":base_url.replace(/^https?:\/\//,""),
                     "origin":base_url,"referer":url,"Upgrade-Insecure-Requests": "1"};
        var data={},j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;


        // Setup data values
        for(i=0;i<inp.length;i++) {
            if((inp[i].tagName==="INPUT" && (inp[i].type==="hidden"||inp[i].type==="text"||
                                    ((inp[i].type==="radio"||inp[i].type==="checkbox") && inp[i].checked)|| (inp[i].type==="submit"&&inp[i].value==="Search")))
                                     || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value; }
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        College.do_actual_dir_query(doc,url,resolve,reject,form,query_url,data_str,headers);

    };
    College.do_actual_dir_query=function(doc,url,resolve,reject,form,query_url,data_str,headers) {
        if(/post/i.test(form.method)) {
            GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                               onload: function(response) {
                                   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                   console.log("POST Found url="+response.finalUrl);
                                   parse_fullpage(doc,url);
                                  // console.log("response.responseText="+response.responseText);
                                 resolve("");
                               },
                               onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
        }

        else if(/get/i.test(form.method)) {
            console.log("GET, url="+query_url+"?"+data_str);
            var promise=MTP.create_promise(query_url+"?"+data_str,Gov.load_scripts,resolve,reject,{});
//                                                     MTP.my_catch_func,{})); }

         GM_xmlhttpRequest({method: 'GET', url: query_url+"?"+data_str,
                               onload: function(response) {
                                   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                   console.log("GET Found url="+response.finalUrl);
                                   resolve("");
                               },
                               onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
        }
    };


    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x;
        add_to_sheet_govt();
        for(x in my_query.fields) {
            if(document.getElementById(x) && my_query.fields[x].length>0) {
                document.getElementById(x).value=my_query.fields[x];
            }
            
        }
    }

    function GovQual(curr) {
        var x;
        this.quality=0;
        for(x in curr) this[x]=curr[x];
        if(!this.name||!this.title) {
            this.quality=-1;
            return;
        }
     //   var nlp_out=nlp(this.name).people().out('topk');
        this.name=this.name.replace(new RegExp(my_query.last,"i"),function(match) {
            if(!/[a-z]/.test(match)) return match.charAt(0)+match.substring(1).toLowerCase();
            else return match; });
        this.fullname=MTP.parse_name(this.name);
        var fname=this.fullname.fname,lname=this.fullname.lname;
        if(MTP.removeDiacritics(fname).toLowerCase()===my_query.first.toLowerCase()) this.quality+=2;
        else {
            if(MTP.removeDiacritics(fname).toLowerCase().charAt(0)===my_query.first.toLowerCase().charAt(0)) this.quality+=1;
            /* TODO: check name synonyms */
        }
         if(MTP.removeDiacritics(lname).toLowerCase()===my_query.last.toLowerCase()) this.quality+=3;
        if(this.quality>=3 && this.email && this.email.length>2) this.quality+=1;
        if(this.quality>=3 && this.phone && this.phone.length>2) this.quality+=0.5;

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
        if(qual_list.length>=1 && qual_list[0].quality>=3) {
            console.log("Found qual_list"+JSON.stringify(qual_list[0]));
            my_query.fields.email=qual_list[0].email?qual_list[0].email:"";
            my_query.fields.title=qual_list[0].title?qual_list[0].title:"";
            my_query.fields.phone=qual_list[0].phone?qual_list[0].phone:"";
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
        is_done_dones=is_done;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done &&
           !my_query.submitted && (my_query.submitted=true) && (MTurk.submitted=true)) {
            if(my_query.fields.email.length>0||(my_query.fields.title.length>0 && my_query.fields.phone.length>0)) {
                MTurk.submitted=true;
                MTurk.check_and_submit(); }
            else {
                console.log("Insufficient info found, returning");
                GM_setValue("returnHit"+MTurk.assignment_id,true);
                return;
            }
        }
    }
 

    function paste_data(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        var ret=Gov.parse_data_func(text);
        if(ret&&ret.name&&ret.title) Gov.contact_list.push(ret);
        else e.target.value=text;
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
    var find_phone=function(doc,url) {
        var schoolphone,phone="",match;
        var phone_re_str_begin="(?:Tel|Telephone|Phone|Ph|P|T):\\s*";
        var phone_re_str_end="([(]?[0-9]{3}[)]?[-\\s\\.\\/]+[0-9]{3}[-\\s\\.\\/]+[0-9]{4,6}(\\s*(x|ext\\.?)\\s*[\\d]{1,5})?)";
        var ext_phone_re=new RegExp(phone_re_str_begin+phone_re_str_end,"i");
        if((schoolphone=doc.querySelector("a[href^='tel:']"))) phone=schoolphone.innerText.trim();
        else if(!phone && (match=doc.body.innerHTML.match(ext_phone_re))) phone=match[1];
        else if((match=doc.body.innerHTML.match(phone_re))) phone=match[0];//console.log("phone alone match="+match);
        return phone;
    };
    var parse_none=function(doc,url,resolve,reject,self) {
        var promise_list=[],i,links=doc.links,query_list=[],schoolphone,phone;
        if(/FuseAction/.test(url)) {
            parse_fuseaction(doc,url);
        }
        var lastreg=new RegExp(my_query.last,"i");
        if(lastreg.test(url)) {
            parse_fullpage(doc,url);
        }
        console.log("Beginning parse_none");
        promise_list.push(MTP.create_promise(url,Gov.load_scripts,MTP.my_then_func,
                                                     MTP.my_catch_func,{}));
        var last_regex=new RegExp(my_query.last,"i");
        phone=find_phone(doc,url);
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            //console.log("links["+i+"].innerText="+links[i].innerText+", href="+links[i].href);
            if(MTP.get_domain_only(links[i].href,true)===MTP.get_domain_only(url,true) && query_list.length<12&&
                (last_regex.test(links[i].innerText)||
                 /(^(Admin|District))|Contact|Directory|Staff|About|Leadership|Team|Management/i.test(links[i].innerText))

               && !is_bad_link(links[i].href)
              && !query_list.includes(links[i].href)
              ) {
                query_list.push(links[i].href);
                promise_list.push(MTP.create_promise(links[i].href,Gov.load_scripts,MTP.my_then_func,
                                                     MTP.my_catch_func,{})); }
        }
        Promise.all(promise_list).then(function(ret) {
            let i,curr,match;
            for(i=0;i<Gov.contact_list.length;i++) {
                curr=Gov.contact_list[i];
                if(!Gov.contact_list[i].phone && phone && phone.length>0) Gov.contact_list[i].phone=phone;
                if(Gov.contact_list[i].email) Gov.contact_list[i].email=Gov.contact_list[i].email
                    .replace(/^it\.(.*)(osu.edu).*$/,"$1$2").replace(/^20/,"").replace(/^Email/,"");
                else if(!Gov.contact_list[i].phone && my_query.collegephone &&
                        my_query.collegephone.length>0) Gov.contact_list[i].phone=my_query.collegephone;
               // console.log("Gov.contact_list["+i+"]="+JSON.stringify(curr));
                add_to_sheet();
            }
            resolve(self);
        }).catch(function(error) {
            console.log("Error: "+error); });
    };

    function parse_fullpage(doc,url) {
        console.log("Parsing full page "+url);

         var div=doc.querySelectorAll("div,li,td");
        div.forEach(function(elem) {
            my_parse_contact_div(elem,"",url); });

    }
    var my_parse_contact_div=function(elem,name,url) {
        //  console.time("contact_div");
        if(Gov.debug) console.log("Gov.parse_contact_div,url="+url);
        // console.log("elem.outerHTML="+elem.outerHTML);
        elem.innerHTML = elem.innerHTML.replace(/&nbsp;/g, ' - ').replace(/\<br\>/g,' - ');
        var ret,p_adds=0,add_count=0;
        var bolds=elem.querySelectorAll("b,strong"),i,curr_text;

        var curr_bold=0,match,curr_regexp;
        var text=elem.innerText.replace(/\n\n+/,"\n");
        var nodelist=elem.childNodes,curr_node;
        Gov.fix_emails(elem);
        text=Gov.textify_elem(elem).trim().replace(/\n\n+/g,"\n");

        if(bolds.length>2) {
         
            for(i=0;i<bolds.length; i++) {
                //console.log("bolds["+i+"]="+bolds[i].innerText);
                curr_regexp=i<bolds.length-1?new RegExp("("+Gov.regexpify_str(bolds[i].innerText.trim())+"[^]*)"+Gov.regexpify_str(bolds[i+1].innerText.trim()),"i") :
                new RegExp("("+Gov.regexpify_str(bolds[i].innerText)+"[^]*)","i");
                //  console.log("curr_regexp="+curr_regexp);
                if((match=text.match(curr_regexp)) && match.length>=2 && match[1]!==undefined && (ret=Gov.parse_data_func(match[1].replace(/\n\n+/g,"\n")))
                   && ret.name && ret.title && ret.email && ++add_count) {
                    //console.log("match["+i+"]="+JSON.stringify(match));
                    Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:name})); }
            }
        }
        if((ret=Gov.parse_data_func(text))&&ret.name) {
            console.log("text="+text+", ret="+JSON.stringify(ret));
            if(ret.name && ret.title && ret.email
           ) Gov.contact_list.push(ret);

        }

        Gov.strip_bad_contacts();
        //  console.timeEnd("contact_div");
        return add_count;
    };

    function parse_fuseaction(doc,url) {
        var ret={},g,btn;
        console.log("in parse_fuseaction, url="+url);
        var group=doc.querySelectorAll(".form-group"),label,value,x,y,ltext,vtext;
        var term_map={"name":/name/i,"title":/title/i,"phone":/phone/i,"email":/email/i};
        for(g of group) {
            console.log("g="+g);
            label=g.querySelector(".config-form-label");
            value=g.querySelector(".config-form-element");
            if(btn=value.querySelector("button")) btn.parentNode.removeChild(btn);
          //  console.log("label="+label+", value="+value);
            if(!label || !value) continue;
            ltext=label.innerText;
            vtext=value.innerText;
            for(x in term_map) {
                if(term_map[x].test(ltext)) ret[x]=vtext.trim();
            }
        }
        console.log("parse_fuseaction,ret="+JSON.stringify(ret));
        Gov.contact_list.push(ret);
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        var well=document.querySelectorAll(".well");
        var input=document.querySelectorAll("input.form-control");

        input[1].id="phone";
        input[2].id="title";
        input[2].type="text";

        my_query={company:well[0].innerText.trim(),last:well[1].innerText.trim(),first:well[2].innerText.trim(),
                  
                  fields:{email:"","phone":"","title":""},gov_url_list:[],gov_promise_list:[],try_count:{'gov':0},
                  done:{domain_query:false,gov:false,directory:false},submitted:false};
        my_query.last=my_query.last.replace(/^[A-Za-z]{3,}\s/,"");
        if(/^([A-Za-z\s]+University\s).*$/.test(my_query.company) && !/^([A-Za-z\s]+University of).*$/.test(my_query.company)) {
            my_query.company=my_query.company.replace(/^([A-Za-z\s]+University\s).*$/,"$1");
        }
        var search_str=my_query.company;
        document.getElementById("email").addEventListener("paste",paste_data);

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"domain_query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); });
        const dirPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.company+" directory", resolve, reject, query_response,"directory");
        });

        dirPromise.then(dir_promise_then)
            .catch(function(val) {
            console.log("Failed at this dir " + val);
            my_query.done.directory=true;

            submit_if_done();
        });

       



    }

})();