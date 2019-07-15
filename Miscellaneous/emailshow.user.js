// ==UserScript==
// @name         emailshow
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        *
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js

// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var convert_cyberschools_email=function(text) {
        var split_text=[],i,ret="";
        /* map to correct character */
        function get_value(char) {
            if(/^[A-Z]+/.test(char)) return (char.charCodeAt(0)-65);
            else if(/^[a-z]+/.test(char)) return (26+char.charCodeAt(0)-97);
            else if(/^[0-9]+/.test(char)) return (52+char.charCodeAt(0)-48);
            else {
                console.log("Got a non-alphanumeric character"); return -1; }
        }

        /* get the first character */
        function get_first(text) { return text.length>=2 ? String.fromCharCode(get_value(text.charAt(0))*4+get_value(text.charAt(1))/16) : ""; }
        function get_second(text) { return text.length>=3 ? String.fromCharCode((get_value(text.charAt(1))%16)*16+get_value(text.charAt(2))/4) : ""; }
        function get_third(text) { return text.length>=4 ? String.fromCharCode((get_value(text.charAt(2))%4)*64+get_value(text.charAt(3))): ""; }
        for(i=0;i<text.length;i+=4) split_text.push(text.substr(i,4));
        for(i=0;i<split_text.length; i++) {
            split_text[i]=split_text[i].replace(/\=/g,"");
            ret=ret+get_first(split_text[i])+get_second(split_text[i])+get_third(split_text[i]);
        }
        return ret;

    };
    var email_re=/e[\-]?mail/i;
    var email_re2 = /(([^\/<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
    var mailto_re=/^\s*mailto:/;
    var javascriptO_re=/javascript:O\(\'([^\']+)\',\s*([^,]+),\s*([^,]+)\)/;
    function l(m, n, o) {
        var u,v,i;
        u = m;
        v = (m * m) % n;
        if (o % 2 == 0)
            u = 1;
        o = o / 2;
        for (i = 1; i <= o; i++) {
            u = (v * u) % n;
        }
        return u;
    }

    function O2(x, z, y) {
        var a,b,c,f,q,t;
        x += ' ';
        a = x.length;
        c = 0;
        b = '';
        f = new Array();
        f = x.split('&');
        q = f.length;
        for (t = 0; t < q; t++) {
            b += String.fromCharCode(l(f[t], z, y));
        }
        return b;
    }


 
    function convert_the_emails(text) {
        var i,text_re=/([\d]+)/,text_match,split_text=[],split_text2="",min_val=9999,x;
        if((text_match=text.match(text_re))) {
            text=text_match[1];
           // console.log("not null, text="+text);
            for(i=0; i < text.length; i+=4) split_text.push(text.substr(i,4));
            for(i=0; i < split_text.length; i++) if(parseInt(split_text[i])<min_val) min_val=parseInt(split_text[i]);
            /** Probably should fix to take the minimum valued one or something in case it's .k12.XX.us **/
            x = min_val;//parseInt(split_text[split_text.length-4]);
            for(i=0; i < split_text.length; i++) split_text2=split_text2+String.fromCharCode(46+(parseInt(split_text[i])-x)/2);
            text=split_text2;
        }
        text=text.replace(/^mailto:/,"");
        return text;
    }
    function convert_email_good(text) {
        var i,text_re=/\?e\=([\d]+)/,text_match,split_text=[],split_text2="",min_val=9999,x;
        if((text_match=text.match(text_re))) {
            for(i=0; i < text_match[1].length; i+=4) split_text.push(text_match[1].substr(i,4));
            /** Probably should fix to take the minimum valued one or something in case it's .k12.XX.us **/
            for(i=0; i < split_text.length; i++) if(parseInt(split_text[i])<min_val) min_val=parseInt(split_text[i]);
            x=min_val;
            for(i=0; i < split_text.length; i++) split_text2=split_text2+String.fromCharCode(46+(parseInt(split_text[i])-x)/2);
           // console.log(JSON.stringify(split_text2));
            text=split_text2;
        }
        text=text.replace(/^mailto:/,"");
        return text;
    }
    /**
     * Match if it has the word email in the innerText
     */
    function do_email_re_match(link)
    {
        console.log("matched email_re");
        //   console.log("Match email_re for "+link.textContent+", "+link.href);
        if(/\?e\=(\d+)/.test(link.href)) link.innerText=convert_email_good(link.href);
        else if(/\/email\/indexjspe([\d]+)/.test(link.href)) {
            console.log("found "+link.href);
            let match;
            if((match=link.href.match(/\/email\/indexjspe([\d]+)/))) link.innerHTML=convert_email_good("?e="+match[1]);
        }
        else link.innerText=link.href.replace(/^\s*mailto:\s*/,"");
       
    }

    function do_decode_encoded_email(link,i)
    {
        console.log("found link with % in onclick at "+i);
        var quote_regex=/(?:\'|\")([^\'\"]+)(?:\'|\")/;
        var quote_match=link.onclick.toString().match(quote_regex);
        if(quote_match===null) { console.log("No string literal match"); return; }
        var str=decodeURIComponent(quote_match[1]);
        console.log("Decoded str="+str);
        if(/nospam/i.test(str))
        {
            if(!/@/i.test(str)) str=str.replace(/[^A-Za-z0-9]+nospam[^A-Za-z0-9]+/i,"@");
            else str=str.replace(/[^A-Za-z0-9]+nospam[^A-Za-z0-9]+/i,"");
        }
        console.log("Further decoded str="+str);
        link.innerHTML=str;

    }


    /**
     * Find the emails and unhide them
     */
    function do_emails() {
        var bob=document.getElementsByClassName("ksl-jobtitle"),match;
        for(i=0; i < bob.length; i++) bob[i].innerHTML=" | "+bob[i].innerText;
        var e=document.getElementsByName("e"),i,new_email;
        var x,a_links=document.links;
        var div=document.getElementsByTagName("div"),img_links=document.getElementsByTagName("img");
        for(i=0; i < div.length; i++) if((/email/i.test(div[i].id) || /email/i.test(div[i].className))
                                         && div[i].style.display==="none") div[i].style.display="block";
        for(i=0; i < img_links.length; i++) img_links[i].setAttribute("alt","");
        for(i=0; i < e.length; i++) {
            if(e[i].tagName==="INPUT" && e[i].type==="hidden") {
                x=document.createElement("div");
                x.innerHTML=convert_the_emails(e[i].value);
                e[i].replaceWith(x);
            }
        }
        for(i=0; i < a_links.length; i++) {
           if((match=a_links[i].href.match(/sendMail\.cfm\?e=(.*)/))) a_links[i].href="mailto:"+convert_cyberschools_email(match[1]);
           //console.log("a_links[i].textContent="+a_links[i].textContent+"\ta_links["+i+"].href="+JSON.stringify(a_links[i].href));
            if(email_re.test(a_links[i].innerText)) { console.log("BOO "+i); do_email_re_match(a_links[i]); }
            else if(/mailto/.test(a_links[i].className) && (match=a_links[i].href.match(email_re2))) {
                a_links[i].href=MTP.swrot13(match[0]); }
            else if(mailto_re.test(a_links[i].href)) {
                var new_br=document.createElement("span"),new_span=document.createElement("span");
                new_br.innerHTML="\t";
                console.log("Adding email at "+i);
                new_span.innerHTML=" - "+a_links[i].href.replace(/^mailto:((\s*)|(%20))?(.*)$/,"$4").replace(/^mailto:\s*(.*)$/,"$1")+" ";

                a_links[i].parentNode.insertBefore(new_span, a_links[i].nextSibling);
                //a_links[i].innerHTML=a_links[i].href.replace(/^mailto:(?:(\s*)|(%20))?(.*)$/,"$3").replace(/^mailto:\s*(.*)$/,"$1")+" ";
 //a_links[i].innerHTML=a_links[i].href
               a_links[i].parentNode.insertBefore(new_br,new_span);
            }
            else if(email_re2.test(a_links[i].href))
            {
                console.log("matched emailre2");
                var email_match=a_links[i].href.match(email_re2);
                a_links[i].innerText=email_match[0];

            }
            else if(a_links[i].dataset.username!==undefined && a_links[i].dataset.domain!==undefined)
            {
                console.log("MOOSHOO");
                a_links[i].className="";
                a_links[i].innerText=a_links[i].dataset.username+"@"+a_links[i].dataset.domain; 
            }
            else if(javascriptO_re.test(a_links[i].href)) {
                console.log("TOOSHOO "+i);
                var omatch=a_links[i].href.match(javascriptO_re);
                new_email=O2(omatch[1],parseInt(omatch[2]),parseInt(omatch[3])).replace(/^mailto:\s*/,"");
                console.log("new_email="+new_email);
                a_links[i].innerHTML=a_links[i].innerText+" - "+new_email;
            }
            else if(/contact\.aspx\?ename\=([^&]+)&/.test(a_links[i].href)) {
                var regex=/\?ename\=([^&]+)&/,reg_match,domain=get_domain_only(window.location.href);
                if((reg_match=a_links[i].href.match(regex))) a_links[i].innerText="| "+reg_match[1]+"@"+domain;
            }

            else if(/%/.test(a_links[i].onclick)) do_decode_encoded_email(a_links[i],i);
        }
        do_appsstaff();
        do_swstaff();
    }
    function do_appsstaff()
    {
        var i;
        var staff_elem=document.getElementsByClassName("staff-categoryStaffMember");
        for(i=0; i < staff_elem.length; i++)
        {
            console.log("staff_elem[i]="+staff_elem[i].innerHTML);
            var the_url=staff_elem[i].getElementsByTagName("a")[0].href;

            if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
            do_appsstaff_request(staff_elem[i], the_url);


        }
    }

    function do_swstaff()
    {
        var i;
        var sw_elem=document.getElementsByClassName("sw-directory-item");
        for(i=0; i < sw_elem.length; i++)
        {
            console.log("sw-directory-item[i]="+sw_elem[i].innerHTML+"\turl="+sw_elem[i].href);
            var the_url=sw_elem[i].href;

           // if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
         //   console.log("doing sw_request on url="+the_url);
            do_swrequest(sw_elem[i], the_url);


        }
        var alpha=document.getElementsByClassName("sw-directory-alphabetical-group-heading");
        for(i=0; i < alpha.length; i++) { alpha[i].innerHTML=""; }
    }

    function swrot13(str) {
        var i,new_str="";
        str=str.toLowerCase();
        for(i=0; i < str.length; i++) {
            if(/[a-z]/.test(str.substr(i,1))) new_str=new_str+String.fromCharCode(((str.charCodeAt(i)-'a'.charCodeAt(0)+13)%26)+'a'.charCodeAt(0));
            else new_str=new_str+str.charAt(i); }
        return new_str;
    }

    function do_appsstaff_request(the_elem, the_url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url:    the_url,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);


                    var photowrap=the_elem.getElementsByTagName("dl")[0];
                var the_degree=photowrap.getElementsByClassName("staffDegrees");
                if(the_degree.length>0)
                {
                    photowrap.removeChild(the_degree[0]);
                }
                var the_dd=document.createElement("dd"),the_dd2=document.createElement("dd");
                the_dd2.innerHTML="Teacher";
                var e_response=get_email(response);
                console.log(e_response);
                console.log(convert_the_emails(e_response));
                the_dd.innerHTML=convert_the_emails(e_response);
                if(photowrap.children.length<2)
                {
                    photowrap.appendChild(the_dd2);
                }
                photowrap.appendChild(the_dd);


            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }


        });
    }

    function do_swrequest(the_elem, the_url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url:    the_url,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);
                var doc = new DOMParser()
                .parseFromString(response.responseText, "text/html");
               // console.log("in response for "+the_url);
               // console.log("doc.body.innerText="+doc.body.innerHTML);
                var about=doc.getElementById("about-teacher-information");
                var bio=doc.getElementById("about-teacher-bio");
                var the_email="";
                var temp_email="";
                var rot_regex=/swrot13\(\'([^\']*)\'\)/;
                var rot_match;
                var teacher_num="";
                if(about!==null)
                {
                    var the_script=about.getElementsByTagName("script");
                    if(the_script.length>0)
                    {
                        rot_match=the_script[0].innerText.match(rot_regex);
                        if(rot_match!==null)
                        {
                            the_email=swrot13(rot_match[1]);
                           // console.log("the_email="+the_email);
                            if(the_email!=="")
                            {
                                the_elem.innerHTML=the_elem.innerText.replace(/\(([^\)]+)\)/," - $1")+" - "+the_email;
                            }

                            return;
                        }

                    }
                    else if(about.firstChild.tagName==="IMG")
                    {
                        teacher_num=about.firstChild.id.match(/\-([\d]+)$/)[1];
                    }
                }
                if(bio!==null && teacher_num!==null)
                {
                    var inner_t=bio.innerText;
                    var subject="", email="";
                    var subj_match=inner_t.match(/Subject[^:]*: ([^\n]+)/);
                    if(subj_match!==null) subject=subj_match[1];
                    if(bio.getElementsByTagName("a").length>0)
                    {
                        email=bio.getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");

                    }
                    the_elem.innerHTML=the_elem.innerText.replace(/\(([^\)]+)\)/," - $1")+" - "+subject+" - " + email;
                    return;
                }
                var wrapper=doc.getElementById("sw-content-layout-wrapper");
                if(wrapper!==null)
                {
                    var email_match=wrapper.innerText.match(email_re2);
                    if(email_match!==null)
                    {
                        console.log(JSON.stringify(email_match));
                        the_elem.innerHTML=the_elem.innerText.replace(/\(([^\)]+)\)/," - $1")+" - "+email_match[0].replace(/Phone$/,"");
                        return;
                    }
                }
                
                




            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }


        });
    }

    function get_email(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
       // console.log("the_elem.innerText="+the_elem.innerHTML);
        var the_inp=doc.getElementsByName("e")[0].value.replace(/,/g,"");
        return the_inp;


    }

    window.onload=function() { setTimeout(do_emails,500); };

})();