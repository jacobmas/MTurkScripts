var LZString = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    _f: String.fromCharCode,
    compressToBase64: function(c) {
        if (c == null) {
            return ""
        }
        var a = "";
        var k, h, f, j, g, e, d;
        var b = 0;
        c = LZString.compress(c);
        while (b < c.length * 2) {
            if (b % 2 == 0) {
                k = c.charCodeAt(b / 2) >> 8;
                h = c.charCodeAt(b / 2) & 255;
                if (b / 2 + 1 < c.length) {
                    f = c.charCodeAt(b / 2 + 1) >> 8
                } else {
                    f = NaN
                }
            } else {
                k = c.charCodeAt((b - 1) / 2) & 255;
                if ((b + 1) / 2 < c.length) {
                    h = c.charCodeAt((b + 1) / 2) >> 8;
                    f = c.charCodeAt((b + 1) / 2) & 255
                } else {
                    h = f = NaN
                }
            }
            b += 3;
            j = k >> 2;
            g = ((k & 3) << 4) | (h >> 4);
            e = ((h & 15) << 2) | (f >> 6);
            d = f & 63;
            if (isNaN(h)) {
                e = d = 64
            } else {
                if (isNaN(f)) {
                    d = 64
                }
            }
            a = a + LZString._keyStr.charAt(j) + LZString._keyStr.charAt(g) + LZString._keyStr.charAt(e) + LZString._keyStr.charAt(d)
        }
        return a
    },
    decompressFromBase64: function(g) {
        if (g == null) {
            return ""
        }
        var a = "", d = 0, e, o, m, k, n, l, j, h, b = 0, c = LZString._f;
        g = g.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (b < g.length) {
            n = LZString._keyStr.indexOf(g.charAt(b++));
            l = LZString._keyStr.indexOf(g.charAt(b++));
            j = LZString._keyStr.indexOf(g.charAt(b++));
            h = LZString._keyStr.indexOf(g.charAt(b++));
            o = (n << 2) | (l >> 4);
            m = ((l & 15) << 4) | (j >> 2);
            k = ((j & 3) << 6) | h;
            if (d % 2 == 0) {
                e = o << 8;
                if (j != 64) {
                    a += c(e | m)
                }
                if (h != 64) {
                    e = k << 8
                }
            } else {
                a = a + c(e | o);
                if (j != 64) {
                    e = m << 8
                }
                if (h != 64) {
                    a += c(e | k)
                }
            }
            d += 3
        }
        return LZString.decompress(a)
    },
    compressToUTF16: function(d) {
        if (d == null) {
            return ""
        }
        var b = "", e, j, h, a = 0, g = LZString._f;
        d = LZString.compress(d);
        for (e = 0; e < d.length; e++) {
            j = d.charCodeAt(e);
            switch (a++) {
            case 0:
                b += g((j >> 1) + 32);
                h = (j & 1) << 14;
                break;
            case 1:
                b += g((h + (j >> 2)) + 32);
                h = (j & 3) << 13;
                break;
            case 2:
                b += g((h + (j >> 3)) + 32);
                h = (j & 7) << 12;
                break;
            case 3:
                b += g((h + (j >> 4)) + 32);
                h = (j & 15) << 11;
                break;
            case 4:
                b += g((h + (j >> 5)) + 32);
                h = (j & 31) << 10;
                break;
            case 5:
                b += g((h + (j >> 6)) + 32);
                h = (j & 63) << 9;
                break;
            case 6:
                b += g((h + (j >> 7)) + 32);
                h = (j & 127) << 8;
                break;
            case 7:
                b += g((h + (j >> 8)) + 32);
                h = (j & 255) << 7;
                break;
            case 8:
                b += g((h + (j >> 9)) + 32);
                h = (j & 511) << 6;
                break;
            case 9:
                b += g((h + (j >> 10)) + 32);
                h = (j & 1023) << 5;
                break;
            case 10:
                b += g((h + (j >> 11)) + 32);
                h = (j & 2047) << 4;
                break;
            case 11:
                b += g((h + (j >> 12)) + 32);
                h = (j & 4095) << 3;
                break;
            case 12:
                b += g((h + (j >> 13)) + 32);
                h = (j & 8191) << 2;
                break;
            case 13:
                b += g((h + (j >> 14)) + 32);
                h = (j & 16383) << 1;
                break;
            case 14:
                b += g((h + (j >> 15)) + 32, (j & 32767) + 32);
                a = 0;
                break
            }
        }
        return b + g(h + 32)
    },
    decompressFromUTF16: function(d) {
        if (d == null) {
            return ""
        }
        var b = "", h, j, a = 0, e = 0, g = LZString._f;
        while (e < d.length) {
            j = d.charCodeAt(e) - 32;
            switch (a++) {
            case 0:
                h = j << 1;
                break;
            case 1:
                b += g(h | (j >> 14));
                h = (j & 16383) << 2;
                break;
            case 2:
                b += g(h | (j >> 13));
                h = (j & 8191) << 3;
                break;
            case 3:
                b += g(h | (j >> 12));
                h = (j & 4095) << 4;
                break;
            case 4:
                b += g(h | (j >> 11));
                h = (j & 2047) << 5;
                break;
            case 5:
                b += g(h | (j >> 10));
                h = (j & 1023) << 6;
                break;
            case 6:
                b += g(h | (j >> 9));
                h = (j & 511) << 7;
                break;
            case 7:
                b += g(h | (j >> 8));
                h = (j & 255) << 8;
                break;
            case 8:
                b += g(h | (j >> 7));
                h = (j & 127) << 9;
                break;
            case 9:
                b += g(h | (j >> 6));
                h = (j & 63) << 10;
                break;
            case 10:
                b += g(h | (j >> 5));
                h = (j & 31) << 11;
                break;
            case 11:
                b += g(h | (j >> 4));
                h = (j & 15) << 12;
                break;
            case 12:
                b += g(h | (j >> 3));
                h = (j & 7) << 13;
                break;
            case 13:
                b += g(h | (j >> 2));
                h = (j & 3) << 14;
                break;
            case 14:
                b += g(h | (j >> 1));
                h = (j & 1) << 15;
                break;
            case 15:
                b += g(h | j);
                a = 0;
                break
            }
            e++
        }
        return LZString.decompress(b)
    },
    compress: function(e) {
        if (e == null) {
            return ""
        }
        var h, l, n = {}, m = {}, o = "", c = "", r = "", d = 2, g = 3, b = 2, q = "", a = 0, j = 0, p, k = LZString._f;
        for (p = 0; p < e.length; p += 1) {
            o = e.charAt(p);
            if (!Object.prototype.hasOwnProperty.call(n, o)) {
                n[o] = g++;
                m[o] = true
            }
            c = r + o;
            if (Object.prototype.hasOwnProperty.call(n, c)) {
                r = c
            } else {
                if (Object.prototype.hasOwnProperty.call(m, r)) {
                    if (r.charCodeAt(0) < 256) {
                        for (h = 0; h < b; h++) {
                            a = (a << 1);
                            if (j == 15) {
                                j = 0;
                                q += k(a);
                                a = 0
                            } else {
                                j++
                            }
                        }
                        l = r.charCodeAt(0);
                        for (h = 0; h < 8; h++) {
                            a = (a << 1) | (l & 1);
                            if (j == 15) {
                                j = 0;
                                q += k(a);
                                a = 0
                            } else {
                                j++
                            }
                            l = l >> 1
                        }
                    } else {
                        l = 1;
                        for (h = 0; h < b; h++) {
                            a = (a << 1) | l;
                            if (j == 15) {
                                j = 0;
                                q += k(a);
                                a = 0
                            } else {
                                j++
                            }
                            l = 0
                        }
                        l = r.charCodeAt(0);
                        for (h = 0; h < 16; h++) {
                            a = (a << 1) | (l & 1);
                            if (j == 15) {
                                j = 0;
                                q += k(a);
                                a = 0
                            } else {
                                j++
                            }
                            l = l >> 1
                        }
                    }
                    d--;
                    if (d == 0) {
                        d = Math.pow(2, b);
                        b++
                    }
                    delete m[r]
                } else {
                    l = n[r];
                    for (h = 0; h < b; h++) {
                        a = (a << 1) | (l & 1);
                        if (j == 15) {
                            j = 0;
                            q += k(a);
                            a = 0
                        } else {
                            j++
                        }
                        l = l >> 1
                    }
                }
                d--;
                if (d == 0) {
                    d = Math.pow(2, b);
                    b++
                }
                n[c] = g++;
                r = String(o)
            }
        }
        if (r !== "") {
            if (Object.prototype.hasOwnProperty.call(m, r)) {
                if (r.charCodeAt(0) < 256) {
                    for (h = 0; h < b; h++) {
                        a = (a << 1);
                        if (j == 15) {
                            j = 0;
                            q += k(a);
                            a = 0
                        } else {
                            j++
                        }
                    }
                    l = r.charCodeAt(0);
                    for (h = 0; h < 8; h++) {
                        a = (a << 1) | (l & 1);
                        if (j == 15) {
                            j = 0;
                            q += k(a);
                            a = 0
                        } else {
                            j++
                        }
                        l = l >> 1
                    }
                } else {
                    l = 1;
                    for (h = 0; h < b; h++) {
                        a = (a << 1) | l;
                        if (j == 15) {
                            j = 0;
                            q += k(a);
                            a = 0
                        } else {
                            j++
                        }
                        l = 0
                    }
                    l = r.charCodeAt(0);
                    for (h = 0; h < 16; h++) {
                        a = (a << 1) | (l & 1);
                        if (j == 15) {
                            j = 0;
                            q += k(a);
                            a = 0
                        } else {
                            j++
                        }
                        l = l >> 1
                    }
                }
                d--;
                if (d == 0) {
                    d = Math.pow(2, b);
                    b++
                }
                delete m[r]
            } else {
                l = n[r];
                for (h = 0; h < b; h++) {
                    a = (a << 1) | (l & 1);
                    if (j == 15) {
                        j = 0;
                        q += k(a);
                        a = 0
                    } else {
                        j++
                    }
                    l = l >> 1
                }
            }
            d--;
            if (d == 0) {
                d = Math.pow(2, b);
                b++
            }
        }
        l = 2;
        for (h = 0; h < b; h++) {
            a = (a << 1) | (l & 1);
            if (j == 15) {
                j = 0;
                q += k(a);
                a = 0
            } else {
                j++
            }
            l = l >> 1
        }
        while (true) {
            a = (a << 1);
            if (j == 15) {
                q += k(a);
                break
            } else {
                j++
            }
        }
        return q
    },
    decompress: function(k) {
        if (k == null) {
            return ""
        }
        if (k == "") {
            return null
        }
        var o = [], j, d = 4, l = 4, h = 3, q = "", t = "", g, p, r, s, a, b, n, m = LZString._f, e = {
            string: k,
            val: k.charCodeAt(0),
            position: 32768,
            index: 1
        };
        for (g = 0; g < 3; g += 1) {
            o[g] = g
        }
        r = 0;
        a = Math.pow(2, 2);
        b = 1;
        while (b != a) {
            s = e.val & e.position;
            e.position >>= 1;
            if (e.position == 0) {
                e.position = 32768;
                e.val = e.string.charCodeAt(e.index++)
            }
            r |= (s > 0 ? 1 : 0) * b;
            b <<= 1
        }
        switch (j = r) {
        case 0:
            r = 0;
            a = Math.pow(2, 8);
            b = 1;
            while (b != a) {
                s = e.val & e.position;
                e.position >>= 1;
                if (e.position == 0) {
                    e.position = 32768;
                    e.val = e.string.charCodeAt(e.index++)
                }
                r |= (s > 0 ? 1 : 0) * b;
                b <<= 1
            }
            n = m(r);
            break;
        case 1:
            r = 0;
            a = Math.pow(2, 16);
            b = 1;
            while (b != a) {
                s = e.val & e.position;
                e.position >>= 1;
                if (e.position == 0) {
                    e.position = 32768;
                    e.val = e.string.charCodeAt(e.index++)
                }
                r |= (s > 0 ? 1 : 0) * b;
                b <<= 1
            }
            n = m(r);
            break;
        case 2:
            return ""
        }
        o[3] = n;
        p = t = n;
        while (true) {
            if (e.index > e.string.length) {
                return ""
            }
            r = 0;
            a = Math.pow(2, h);
            b = 1;
            while (b != a) {
                s = e.val & e.position;
                e.position >>= 1;
                if (e.position == 0) {
                    e.position = 32768;
                    e.val = e.string.charCodeAt(e.index++)
                }
                r |= (s > 0 ? 1 : 0) * b;
                b <<= 1
            }
            switch (n = r) {
            case 0:
                r = 0;
                a = Math.pow(2, 8);
                b = 1;
                while (b != a) {
                    s = e.val & e.position;
                    e.position >>= 1;
                    if (e.position == 0) {
                        e.position = 32768;
                        e.val = e.string.charCodeAt(e.index++)
                    }
                    r |= (s > 0 ? 1 : 0) * b;
                    b <<= 1
                }
                o[l++] = m(r);
                n = l - 1;
                d--;
                break;
            case 1:
                r = 0;
                a = Math.pow(2, 16);
                b = 1;
                while (b != a) {
                    s = e.val & e.position;
                    e.position >>= 1;
                    if (e.position == 0) {
                        e.position = 32768;
                        e.val = e.string.charCodeAt(e.index++)
                    }
                    r |= (s > 0 ? 1 : 0) * b;
                    b <<= 1
                }
                o[l++] = m(r);
                n = l - 1;
                d--;
                break;
            case 2:
                return t
            }
            if (d == 0) {
                d = Math.pow(2, h);
                h++
            }
            if (o[n]) {
                q = o[n]
            } else {
                if (n === l) {
                    q = p + p.charAt(0)
                } else {
                    return null
                }
            }
            t += q;
            o[l++] = p + q.charAt(0);
            d--;
            p = q;
            if (d == 0) {
                d = Math.pow(2, h);
                h++
            }
        }
    }
};
