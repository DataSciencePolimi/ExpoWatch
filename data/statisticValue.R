ourpoststat2 <- read.csv("~/Documents/Develop/ExpoWatch/ourpoststat2.csv")


vincitori <- ourpoststat2[ourpoststat2$category=="v",]
annuncio <- ourpoststat2[ourpoststat2$category=="a",]
recall <- ourpoststat2[ourpoststat2$category=="r",]
composite <- ourpoststat2[ourpoststat2$category=="c",]
other <- ourpoststat2[ourpoststat2$category=="o",]
finalisti <- ourpoststat2[ourpoststat2$category=="f",]

commentsVincitori = vincitori$totalComments
commentsAnnuncio = annuncio$totalComments
commentsOther = other$totalComments
commentsComposite = composite$totalComments
commentsRecall= recall$totalComments
commentsFinalisti= finalisti$totalCommentsca



commentsMention = c(commentsVincitori,commentsComposite,commentsFinalisti)
commentsGeneral = c(commentsRecall, commentsAnnuncio,commentsOther)

likesVincitori = vincitori$totalLikes
likesAnnuncio = annuncio$totalLikes
likesOther = other$totalLikes
likesComposite = composite$totalLikes
likesRecall= recall$totalLikes
likesFinalisti= finalisti$totalLikes


vc_mean = mean(commentsVincitori)
vc_sd = sd(commentsVincitori)
ac_mean = mean(commentsAnnuncio)
ac_sd = sd(commentsAnnuncio)
rc_mean = mean(commentsRecall)
rc_sd = sd(commentsRecall)
oc_mean = mean(commentsOther)
oc_sd = sd(commentsOther)
cc_mean = mean(commentsComposite)
cc_sd = sd(commentsComposite)
fc_mean = mean(commentsFinalisti)
fc_sd = sd(commentsFinalisti)

totalMean = mean(ourpoststat2$totalComments)
stdError_v = sqrt((sd(ourpoststat2$totalComments)^2)/length(commentsVincitori))

z_v = (vc_mean - totalMean)/stdError_v

# z_v>1.65 p=0.05

stdError_a = sqrt((sd(ourpoststat2$totalComments)^2)/length(commentsAnnuncio))

z_a = (ac_mean - totalMean)/stdError_a

# z_a = -2.9...

stdError_r = sqrt((sd(ourpoststat2$totalComments)^2)/length(commentsRecall))

z_r = (rc_mean - totalMean)/stdError_r

# z_r = -4.22

stdError_o = sqrt((sd(ourpoststat2$totalComments)^2)/length(commentsOther))

z_o = (oc_mean - totalMean)/stdError_o

# z_o = -2.9...

stdError_c = sqrt((sd(ourpoststat2$totalComments)^2)/length(commentsComposite))

z_c = (cc_mean - totalMean)/stdError_c



#
# #comments
# 
# commentsVincitori = vincitori$totalComments
# commentsAnnuncio = annuncio$totalComments
# commentsOther = other$totalComments
# commentsComposite = composite$totalComments
# commentsRecall= recall$totalComments
# 
# vc_mean = mean(commentsVincitori)
# ac_mean = mean(commentsAnnuncio)
# rc_mean = mean(commentsRecall)
# oc_mean = mean(commentsOther)
# cc_mean = mean(commentsComposite)
# 
# totalMean = mean(c(vc_mean,ac_mean,rc_mean,oc_mean,cc_mean))
# 
# Sb = length(commentsAnnuncio)*(ac_mean-totalMean)^2 + length(commentsComposite)*(cc_mean-totalMean)^2 + length(commentsOther)*
# (oc_mean-totalMean)^2 + length(commentsRecall)*(rc_mean-totalMean)^2 + length(commentsVincitori)*(vc_mean-totalMean)^2
# 
# fb = 4 # numero gruppi -1
# 
# MSb = Sb / fb
# 
# normalizedCommentsVincitori = sapply(X = commentsVincitori, FUN = function(x){(x-vc_mean)^2})
# normalizedCommentsAnnuncio = sapply(X = commentsAnnuncio, FUN = function(x){(x-ac_mean)^2})
# normalizedCommentsOther = sapply(X = commentsOther, FUN = function(x){(x-oc_mean)^2})
# normalizedCommentsRecall = sapply(X = commentsRecall, FUN = function(x){(x-rc_mean)^2})
# normalizedCommentsComposite = sapply(X = commentsComposite, FUN = function(x){(x-cc_mean)^2})
# 
# Sw = sum(normalizedCommentsAnnuncio)+sum(normalizedCommentsComposite)+sum(normalizedCommentsOther)+sum(normalizedCommentsRecall)+sum(normalizedCommentsVincitori)
# 
# n = (length(commentsAnnuncio) + length(commentsComposite) + length(commentsOther)+length(commentsRecall)+length(commentsVincitori))/5
# fw = 5*(n-1)
# 
# MSw = Sw/fw
# 
# Fmesaure = MSb/MSw

