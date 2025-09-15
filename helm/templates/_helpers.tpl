{{/*
Expand the name of the chart.
*/}}
{{- define "mercadol-pithing.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mercadol-pithing.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mercadol-pithing.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mercadol-pithing.labels" -}}
helm.sh/chart: {{ include "mercadol-pithing.chart" . }}
{{ include "mercadol-pithing.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mercadol-pithing.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mercadol-pithing.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "mercadol-pithing.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the secret to use
*/}}
{{- define "mercadol-pithing.secretName" -}}
{{- if .Values.secret.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.secret.name }}
{{- else }}
{{- default "default" .Values.secret.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the configmap to use
*/}}
{{- define "mercadol-pithing.configMapName" -}}
{{- if .Values.configMap.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.configMap.name }}
{{- else }}
{{- default "default" .Values.configMap.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service to use
*/}}
{{- define "mercadol-pithing.serviceName" -}}
{{- if .Values.service.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.service.name }}
{{- else }}
{{- default "default" .Values.service.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the ingress to use
*/}}
{{- define "mercadol-pithing.ingressName" -}}
{{- if .Values.ingress.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.ingress.name }}
{{- else }}
{{- default "default" .Values.ingress.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the deployment to use
*/}}
{{- define "mercadol-pithing.deploymentName" -}}
{{- if .Values.deployment.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.deployment.name }}
{{- else }}
{{- default "default" .Values.deployment.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the hpa to use
*/}}
{{- define "mercadol-pithing.hpaName" -}}
{{- if .Values.hpa.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.hpa.name }}
{{- else }}
{{- default "default" .Values.hpa.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the pdb to use
*/}}
{{- define "mercadol-pithing.pdbName" -}}
{{- if .Values.pdb.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.pdb.name }}
{{- else }}
{{- default "default" .Values.pdb.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the network policy to use
*/}}
{{- define "mercadol-pithing.networkPolicyName" -}}
{{- if .Values.networkPolicy.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.networkPolicy.name }}
{{- else }}
{{- default "default" .Values.networkPolicy.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service monitor to use
*/}}
{{- define "mercadol-pithing.serviceMonitorName" -}}
{{- if .Values.serviceMonitor.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.serviceMonitor.name }}
{{- else }}
{{- default "default" .Values.serviceMonitor.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the cert manager to use
*/}}
{{- define "mercadol-pithing.certManagerName" -}}
{{- if .Values.certManager.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.certManager.name }}
{{- else }}
{{- default "default" .Values.certManager.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the istio to use
*/}}
{{- define "mercadol-pithing.istioName" -}}
{{- if .Values.istio.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.istio.name }}
{{- else }}
{{- default "default" .Values.istio.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the argocd to use
*/}}
{{- define "mercadol-pithing.argocdName" -}}
{{- if .Values.argocd.create }}
{{- default (include "mercadol-pithing.fullname" .) .Values.argocd.name }}
{{- else }}
{{- default "default" .Values.argocd.name }}
{{- end }}
{{- end }}
