#library(scatterplot3d)
#library(rgl)

userfeatureComplete <- read.csv("~/Documents/Develop/ExpoWatch/userfeatureComplete.csv")
mydata <- userfeatureComplete[(userfeatureComplete$username!="yourexpo2015" & (userfeatureComplete$photosCount>0 || userfeatureComplete$likesCount>1)),]
mydata$commentsCount <- NULL
mydata <- mydata[(mydata$photosCount<250 & mydata$likesCount<600),]

temp <- mydata
mydata$username <- NULL


mydata <- na.omit(mydata) # listwise deletion of missing
mydata <- scale(mydata) # standardize variables

# # K-Means Cluster Analysis
fit <- kmeans(mydata,9) # 7 cluster solution
# # get cluster means
aggregate(mydata,by=list(fit$cluster),FUN=mean)
# # append cluster assignment
clusterData <- data.frame(temp, fit$cluster)
#
plot(x = clusterData$photosCount,y=clusterData$likesCount, col = clusterData$fit.cluster)

#plot3d(clusterData$commentsCount,clusterData$likesCount,clusterData$photosCount, col = clusterData$fit.cluster,ylim=600)
#pdf('prova.pdf')
#dev.off()


#write.csv(clusterData,file='cluster.csv')

 betweenes <- array()
 for(i in 2:15){
 #   K-Means Cluster Analysis
  fit <- kmeans(mydata,i) # 5 cluster solution
 #   get cluster means
  aggregate(mydata,by=list(fit$cluster),FUN=mean)
 #   append cluster assignment
  clusterData <- data.frame(temp, fit$cluster)
  betweenes[i]<-fit$betweenss
  #pdf('prova'+stri+'.pdf')
  #dev.off()
 }

write.csv(betweenes,file='betweenes.csv')
plot(x = 1:15 ,y=betweenes)

wss <- (nrow(mydata)-1)*sum(apply(mydata,2,var))
for (i in 2:15) wss[i] <- sum(kmeans(mydata, 
    centers=i)$betweenss)
plot(1:15, wss, type="b", xlab="Number of Clusters",
  ylab="Within groups sum of squares")



