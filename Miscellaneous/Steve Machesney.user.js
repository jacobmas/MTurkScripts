// ==UserScript==
// @name         Steve Machesney
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find employees for government agency
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/6c166cb7f29e915532c73ecf32fb103d7c24d055/Govt/Government.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["zillow.com","localtown.us","facebook.com","michigantownships.org",".remus.org"];
    var MTurk=new MTurkScript(60000,500+Math.random()*1000,[],begin_script,"A1S00K4T2IGLP",false);
    var MTP=MTurkScript.prototype;

    function acronym(text)
    {
        text=text.replace(/([A-Za-z]{1})-([A-Za-z]{1])/,"$1 $2");
        var ret="",t_split=text.split(" ");
        for(var i=0; i < t_split.length; i++)
            if(/[A-Z]+/.test(t_split[i].substr(0,1))) ret=ret+t_split[i].charAt(0);
        return ret;
    }

    function is_school_district(text)
    {
        return /(\s|^|[a-z]+)(District|Schools|Public School|Local School|((I(\.)?)?S(\.)?D(\.)?)|USD)([\s,]+|$)/i.test(text);
    }
    function is_bad_name2(b_name,p_caption,search_str,b_url)  {
        console.log("in is_bad_name2, b_name="+b_name);
        var b_split=b_name.split(/\s+[\|\-:]\s+/),i,x;
        var search_str_begin=search_str.replace(/\s*,.*$/,"").replace(/\s/g,"");
        var lst=[" School"," Resort"," Communications"," Clinic","Historic Site"," Company"," Law Firm", "Furniture"],temp_regexp;
        if(/not-for-profit/.test(p_caption)) return true;
        for(i=0;i<lst.length;i++) {
            temp_regexp=new RegExp(lst[i]);
            if(temp_regexp.test(b_name) && !temp_regexp.test(search_str)) return true; }
        console.log("Glunk");
        search_str=search_str.replace(/\s*,.*$/,"");
        if(/Chamber of Commerce|Restaurants|Shopping|Visit|Visitor|Local News|Music|Presbyterian/i.test(b_name)) return true;

        if(/(chamber\.(org|com))|(chamberofcommerce)|(\.edu)/.test(b_url)) return true;
        if(/(^|[^A-Za-z]+)(Fun|Festivals|CUSD|home center|Bank of|Motors|Hotel|Inc\.|Travel Information|School|Recycling)($|[^A-Za-z]+)/i.test(b_name)) return true;
        if(/(^|[^A-Za-z]+)(Apartment Home|unofficial site|shopping)($|[^A-Za-z]+)/i.test(p_caption)) return true;
        //if(/^\s*Visit /.test(p_caption)) return true;
        for(x in state_map) {
            if(x===my_query.state) continue;
       //     console.log("x="+x);
            if(new RegExp(search_str_begin+"(-)?"+state_map[x],"i").test(b_url)||new RegExp(search_str_begin+"(-)?"+x,"i").test(b_url)) return true;
            if(new RegExp("(^|[^A-Za-z]+)"+state_map[x]+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp(",\\s*"+x+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp("\\."+state_map[x]+"\\.us","i").test(b_url)) return true;
        }
        console.log("Up to checking b_splits");
        search_str=search_str.split(",")[0];
        console.log("search_str="+search_str);
        for(i=0;i<b_split.length;i++) {
            if(MTP.matches_names(my_query.city,b_split[i])||
               MTP.matches_names(my_query.city,b_split[i].replace(/^(Town|Village|Township|Municipality|City) of /i,""))) return false;
        }


        return true;
    }

    function query_response(response,resolve,reject,type,search_str) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;

        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            /*console.log("b_algo.length="+b_algo.length);*/
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.url&&parsed_context.Title
                   &&!MTP.is_bad_url(parsed_context.url,bad_urls,4,2)) {
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info)) && parsed_lgb.url&&parsed_lgb.url.length>0 &&
               MTP.get_domain_only(window.location.href,true)!==
               MTP.get_domain_only(parsed_lgb.url,true)&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,6,3)) {
            }
            for(i=0; i < b_algo.length&&i<3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)?b_caption[0].getElementsByTagName("p")[0].innerText:"";
                 console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((!MTP.is_bad_url(b_url,bad_urls,4,2)) && (
                                                            !is_bad_name2(b_name,p_caption,search_str,b_url))
                   &&  !(parsed_context&&parsed_context.url&&/^\s*Visit/i.test(b_name)) &&

                   (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        console.log("MOO1");
        if(parsed_context&&parsed_context.url&&parsed_context.url.length>0 &&(resolve(parsed_context.url)||true)) return;
        if(parsed_lgb&&parsed_lgb.url&&parsed_lgb.url.length>0 &&(resolve(parsed_lgb.url)||true)) return;
        if(my_query.try_count===0) {
            my_query.try_count++;
            let search_str=my_query.city+" "+my_query.state;
            query_search(search_str, resolve, reject, query_response,"query");
        }
        else reject("No govt website found");
        //        GM_setValue("returnHit",true);
        return;

    }


    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type,search_str); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }



    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("Success, query_promise_then, result="+result);
        my_query.url=result;
        var dept_regex_lst=[/^((City|Town|Village) )?(Government|Department)$/i,
                           
                            /(Public Works|Parks[^a-zA-z]+|Maintenance|DPW|Service Department|Highway Department|Services|Street|Road Commissioner|Utilities)/i,/(Boro(ugh)?|Town|Village|Township|City) Hall/i];
        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director/i,
                             /(^|[^A-Za-z]+)(Technology|CTO|IT|Network|Water Department)($|[^A-Za-z]+)/i,/Communication|Community/i];
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        var promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            GM_setValue("returnHit"+MTurk.assignment_id,true) },query);
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
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
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            MTurk.submitted=true;
            MTurk.check_and_submit();
        }
    }
    function gov_promise_then(my_result) {
        var i,curr,fullname,x,num;
        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
        console.log("result="+JSON.stringify(result));
        var person_list=[];
        for(i=0;i<result.length;i++) {
            temp=new PersonQual(result[i]);
           
            if(temp.quality>0) {
                person_list.push(temp); }
        }
        person_list.sort(cmp_people);
        console.log("person_list="+JSON.stringify(person_list));
        if(person_list.length>0) {
            curr=person_list[0];
            fullname=MTP.parse_name(curr.name);
            my_query.fields.firstname=fullname.fname;
            my_query.fields.lastname=fullname.lname;
            my_query.fields.jobtitle=curr.title||"n/a";
            my_query.fields.email=curr.email||"na@na.com";
            if(curr.phone) my_query.fields.phone=curr.phone;
            else if(Gov.phone) my_query.fields.phone=Gov.phone;
            else my_query.fields.phone="n/a";

            console.log("Done x");
        }
        else if(Gov.id==="civicplus") {
            submit_if_done();
            return;
        }
        else {
            console.log("Failed to find person");
            add_to_sheet();

            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
        submit_if_done();

//        console.log("result="+JSON.stringify(result));
    }
    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var terms=["name","title","phone","email"],x;
        curr.name=curr.name.trim();
        if(PersonQual.is_bad_person_name(curr.name)) {
            this.quality=-1;
            return;
        }
        for(x of terms) this[x]=curr[x]?curr[x]:(x!=="email"?"n/a":"na@na.com");
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name) {
            fullname=MTP.parse_name(curr.name);
            this.first=fullname.fname;
            this.last=fullname.lname;
        }
        if(this.email==="Email" && Gov.id==="granicus"&&this.first
           &&this.last) this.email=this.first.toLowerCase().charAt(0)+this.last.toLowerCase()+"@"+MTP.get_domain_only(Gov.url,true);
        if(this.email) this.email=this.email.replace(/This email address is being protected from spambots\. You need JavaScript enabled to view it\.(.*@.*)cloak.*$/,"$1");
        if(!/@/.test(this.email)) this.email="na@na.com";

        if((!this.phone ||this.phone==="n/a") && Gov.phone) this.phone=Gov.phone;
        this.quality=0;
        this.type="";
        if(curr.title && (/Public Works|Maintenance|Parks(\s)|Wastewater|Street|Road Commissioner|Building|Highway|((Town|City) (Manager|Administrator))/i.test(curr.title)||/DPW/.test(curr.title)||
           /DPW|Public Works|Service|Parks(\s)|Maintenance|Utilities|Road|Street|Highway/.test(curr.department))) {
            console.log("curr="+JSON.stringify(curr)+", public works");
            this.type="Public Works";
            if(/^(Director of Public Works|Public Works Director)$/i.test(curr.title)) this.quality=6;
            else if(/Administrator|Manager|Supervisor|Director|Superintendent|Commissioner/.test(curr.title)&&/Public Works/i.test(curr.title)) this.quality=4;
            else if(/Administrator|Manager|Supervisor|Director|Superintendent|Commissioner/.test(curr.title)) this.quality=3;
            else if(/Water|Street|Maintenance|Road|Utilities|Highway/.test(curr.title)||/Public Works|Maintenance|Utilities|Road|Street|Highway/.test(curr.department)) this.quality=2;
            else this.quality=1;
            if(/Public Works|DPW/.test(curr.department)) this.quality+=2;
            var nlp_out=nlp(this.name).people().out('topk');
            if(nlp_out.length>0) this.quality+=2;

        }
        else {
            this.quality=-1;
        }
        if(/[\d\#;\?:]+/.test(this.name)) this.quality=-1;

        
    }
    PersonQual.is_bad_person_name=function(name) {
        if(/\s+(Pike|Rd\.|Road|St\.?|Street$)/i.test(name)) return true;
        if(/(^|[^A-Za-z]+)(Monday|Friday|Library|Sheriff\'s|Administration|Ave\.?|Apply|Hours|Sign In|P\.?O\.? Box|Borough|Office|Government|Mayor|Our|Services)($|[^A-Za-z]+)/i.test(name)) return true;
  if(/(^|[^A-Za-z]+)(Click|Here|Contact)($|[^A-Za-z]+)/i.test(name)) return true;
        if(name.split(/\s+/).length>4) return true;

        return false;
    };
     function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

    function paste_data(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/1$/,"");
        var term_list=["","Tech Coordinator","Manager","Clerk"];
        var text = e.clipboardData.getData("text/plain");
        var ret=Gov.parse_data_func(text),fullname;
        if(text==="na") {
            ret={"first":"na","last":"na","title":"na","phone":"na","email":"na"};
        }
        console.log("ret="+JSON.stringify(ret));
        var term_map={"title":"jobtitle","first":"firstname","last":"lastname",phone:"phone",email:"email"},x;
        if(ret) {
            if(ret.name) {
                fullname=MTP.parse_name(ret.name);
                ret.first=fullname.fname;
                ret.last=fullname.lname;
            }
            if(ret.phone) ret.phone=ret.phone.replace(/^([\d]{3}\))/,"($1");
            if(ret.email) ret.email=ret.email.replace(/^20/,"");
            if(ret.title===undefined||ret.title.length===0)  {
                let num=target_type.replace(/^f/,"").replace(/^$/,"0");
                console.log("target_Type="+num+", elem="+parseInt(num));
                ret.title=term_list[parseInt(num)];
            }
            for(x in term_map) {
                if(ret[x]!==undefined) document.getElementsByName(term_map[x])[0].value=ret[x];
            }
        }
        else e.target.value=text;
    }
    function paste_name(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/2$/,"");
        var text = e.clipboardData.getData("text/plain");
        var ret=MTP.parse_name(text.trim());

        var term_map={"fname":"2","lname":"3"},x;
        if(ret&&ret.fname) {

            for(x in term_map) {
                if(ret[x]!==undefined) {
                    my_query.fields[target_type+term_map[x]]=ret[x];
                    document.getElementById(target_type+term_map[x]).value=ret[x];
                }
            }
        }
        else e.target.value=text;
    }

    function add_fill_button() {
        var p=document.querySelector("form .text-center");
        var bn=document.createElement("input");
        Object.assign(bn,{type:"button",value:"Fill"});
        bn.style.margin="0px 80px";
        p.appendChild(bn);
        bn.addEventListener("click",function() {
            Object.assign(my_query.fields,{"firstname":"n/a","lastname":"n/a","jobtitle":"n/a","email":"na@na.com","phone":"n/a"});
            add_to_sheet(); });
    }
    function init_Query()
    {
        console.log("in init_query");
        bad_urls=bad_urls.concat(default_bad_urls);
        var i;
        var agency_match;
        var re=/^LOCATION:\s*(.*),([^,]*),([^,]*)$/,match;

        var ctrl=document.querySelectorAll(".form-control");
        ctrl.forEach(function(elem) { elem.value="na";


                                     });
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var p=document.querySelectorAll("form p");

        if(!(match=p[1].innerText.match(re))) {
            match=p[1].innerText.match(/^LOCATION:\s*([^,]*),([^,]*)$/);
            console.log("match="+JSON.stringify(match));
        }
        my_query={name:"",city:match[1],
                  state: match[2].trim(),agency_type:match.length>3?match[3]:"",agency_number:"",
                  fields:{"firstname":"n/a","lastname":"n/a","jobtitle":"n/a","email":"na@na.com","phone":"n/a"},
                  done:{},submitted:false,try_count:0};
        document.getElementsByName("firstname")[0].addEventListener("paste",paste_data);
        add_fill_button();
        Gov.debug=true;
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.city+" "+my_query.state+" "+my_query.agency_type+" website";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);

            add_to_sheet();
            submit_if_done();

        //    GM_setValue("returnHit"+MTurk.assignment_id,true);
        });


    }

})();