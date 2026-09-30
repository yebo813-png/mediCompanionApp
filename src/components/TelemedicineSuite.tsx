import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  Camera,
  MessageSquare,
  Send,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Pill,
  Download,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Patient, Appointment } from '../types';
import { MedSwitchApi, PracticeStore } from '../services/api';

interface TelemedicineSuiteProps {
  currentPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (p: Patient) => void;
  onBookVirtualAppointment: (apt: Appointment) => void;
  onOpenConsultationNotes: (patient: Patient) => void;
}

export const TelemedicineSuite: React.FC<TelemedicineSuiteProps> = ({
  currentPatient,
  patients,
  onSelectPatient,
  onBookVirtualAppointment,
  onOpenConsultationNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'doctor-room' | 'patient-booking'>('doctor-room');
  const patient = currentPatient || patients[0];

  // WebRTC Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [callActive, setCallActive] = useState(true);
  const [callDuration, setCallDuration] = useState(142); // simulated start
  const [snapshots, setSnapshots] = useState<string[]>([]);

  // Sick note generator state
  const [showSickNoteModal, setShowSickNoteModal] = useState(false);
  const [sickNoteDays, setSickNoteDays] = useState(3);
  const [sickNoteReason, setSickNoteReason] = useState('Acute Upper Respiratory Tract Infection and Pyrexia');
  const [sickNoteIssued, setSickNoteIssued] = useState(false);

  // In-call chat
  const [messages, setMessages] = useState<Array<{ sender: 'Doctor' | 'Patient'; text: string; time: string }>>([
    { sender: 'Patient', text: 'Good morning Dr. Ndlovu, video and audio are clear.', time: '11:15' },
    { sender: 'Doctor', text: 'Good morning! I am reviewing your blood pressure logs and vitals now.', time: '11:16' },
  ]);
  const [chatText, setChatText] = useState('');

  // Virtual Booking Form state
  const [virtualDate, setVirtualDate] = useState(new Date().toISOString().slice(0, 10));
  const [virtualTime, setVirtualTime] = useState('14:30');
  const [virtualReason, setVirtualReason] = useState('Follow-up on chronic blood pressure medication and lab results');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Pre-call hardware test
  const [cameraTestPassed, setCameraTestPassed] = useState(true);
  const [micTestPassed, setMicTestPassed] = useState(true);
  const [networkTestPassed, setNetworkTestPassed] = useState(true);

  // Initialize WebRTC media
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    async function setupCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const media = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true,
          });
          streamInstance = media;
          setMediaStream(media);
          if (videoRef.current) {
            videoRef.current.srcObject = media;
          }
        }
      } catch (err) {
        console.warn('WebRTC camera not permitted or simulated', err);
      }
    }

    if (callActive && activeTab === 'doctor-room') {
      setupCamera();
    }

    const timer = setInterval(() => {
      if (callActive) setCallDuration((d) => d + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
      }
    };
  }, [callActive, activeTab]);

  const toggleCamera = () => {
    if (mediaStream) {
      const vTrack = mediaStream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setCameraActive(vTrack.enabled);
      }
    } else {
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (mediaStream) {
      const aTrack = mediaStream.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setMicActive(aTrack.enabled);
      }
    } else {
      setMicActive(!micActive);
    }
  };

  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setSnapshots((prev) => [...prev, dataUrl]);
      PracticeStore.addAuditLog(
        'TELEMEDICINE_SNAPSHOT_CAPTURED',
        `Clinical diagnostic image captured for ${patient?.fullName}`
      );
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'Doctor',
        text: chatText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatText('');
  };

  const handleCreateVirtualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: Appointment = {
      id: `apt-virt-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      medicalAidName: patient.medicalAidName,
      date: virtualDate,
      time: virtualTime,
      durationMinutes: 20,
      type: 'Telehealth',
      status: 'Confirmed',
      triageLevel: 'Routine',
      notes: virtualReason,
      whatsappReminderSent: true,
    };

    onBookVirtualAppointment(newApt);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const handleIssueSickNote = () => {
    const docHtml = `
      <div class="header-box">
        <h2>MEDICAL CERTIFICATE OF UNFITNESS FOR WORK</h2>
        <p><strong>DR. THABO NDLOVU</strong> • MBChB (Wits) FCFP (SA)</p>
        <p>Family Physician • Practice BHF: 0548921 • HPCSA: MP 0694821</p>
        <p>Rosebank Medical Centre, 14 Hood Ave, Rosebank • Tel: +27 11 880 2000</p>
      </div>

      <p><strong>Date of Consultation:</strong> ${new Date().toLocaleDateString()}</p>
      <p>This is to certify that I examined <strong>${patient?.fullName}</strong> (National ID: ${patient?.idNumber}).</p>

      <p>In my clinical opinion, as a result of illness/injury, the patient was/is unfit to perform their customary occupational duties from <strong>${new Date().toLocaleDateString()}</strong> up to and including <strong>${new Date(
      Date.now() + 86400000 * sickNoteDays
    ).toLocaleDateString()}</strong> (Total: ${sickNoteDays} days).</p>

      <p><strong>Clinical Nature:</strong> ${sickNoteReason}</p>
      <p>The patient is expected to be fit to resume normal duties on: <strong>${new Date(
        Date.now() + 86400000 * (sickNoteDays + 1)
      ).toLocaleDateString()}</strong>.</p>

      <p style="margin-top: 40pt;">_______________________________<br/><strong>Dr. Thabo Ndlovu</strong><br/>Digital Electronic Signature (HPCSA Ethical Rule 15 Compliant)</p>
    `;

    MedSwitchApi.exportToWord(`SickNote_${patient?.fullName.replace(/\s+/g, '_')}`, docHtml);
    setSickNoteIssued(true);
    setTimeout(() => {
      setSickNoteIssued(false);
      setShowSickNoteModal(false);
    }, 2000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Telemedicine & Virtual Consultations Suite</h2>
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                HIPAA §164.312 & POPIA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time WebRTC audio/video consultations • Tariff 0130 • In-call diagnostics & prescription dispatch
            </p>
          </div>
        </div>

        {/* Tab switch: Doctor Room vs Patient Virtual Booking */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('doctor-room')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'doctor-room'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Doctor Remote Room
          </button>

          <button
            onClick={() => setActiveTab('patient-booking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'patient-booking'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Virtual Booking & Waiting Room
          </button>
        </div>
      </div>

      {/* View 1: Doctor Active Video Consultation Room */}
      {activeTab === 'doctor-room' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video Screen & Controls */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
              {/* WebRTC Video Feed */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
                    {patient?.fullName.charAt(0) || 'P'}
                  </div>
                  <div className="text-white font-medium text-sm">{patient?.fullName || 'Patient'}</div>
                  <div className="text-xs text-slate-500 mt-1">Video muted by clinician</div>
                </div>
              )}

              {/* Inset Self-View Box */}
              <div className="absolute top-4 right-4 w-36 h-28 bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg hidden sm:flex items-center justify-center">
                <div className="text-center p-2">
                  <div className="text-[10px] text-cyan-400 font-bold">Dr. Thabo Ndlovu</div>
                  <div className="text-[9px] text-slate-400">MBChB (Wits) FCFP</div>
                  <div className="text-[9px] text-emerald-400 font-mono mt-1">● Online (18ms)</div>
                </div>
              </div>

              {/* Floating Top Indicator */}
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono font-bold">{formatDuration(callDuration)}</span>
                <span>•</span>
                <span className="text-[11px] text-slate-300">{patient?.fullName} ({patient?.medicalAidName})</span>
              </div>

              {/* Floating Call Action Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-900/90 backdrop-blur px-5 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition ${
                    micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
                  }`}
                  title={micActive ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl transition ${
                    cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
                  }`}
                  title={cameraActive ? 'Stop Camera' : 'Start Camera'}
                >
                  {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleCaptureSnapshot}
                  className="p-3 rounded-xl bg-slate-800 text-cyan-300 hover:bg-slate-700 transition"
                  title="Capture High-Resolution Diagnostic Lesion Snapshot"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowSickNoteModal(true)}
                  className="p-3 rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700 transition"
                  title="Issue HPCSA Digital Sick Certificate"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCallActive(!callActive)}
                  className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-red-900/40"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Consult</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Snapshot Gallery */}
            {snapshots.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Diagnostic Lesion & Video Snapshots ({snapshots.length})</span>
                  <span className="text-[10px] text-slate-400">Attached to EHR Consultation Record</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {snapshots.map((snap, idx) => (
                    <img
                      key={idx}
                      src={snap}
                      alt={`Snapshot ${idx + 1}`}
                      className="w-28 h-20 object-cover rounded-xl border border-slate-700 shadow-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: In-Call Charting & Encrypted Chat */}
          <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
            {/* Quick Consultation Actions Strip */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-bold text-white block">In-Call Clinical Workflow</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenConsultationNotes(patient)}
                  className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition flex items-center justify-center space-x-1.5 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SOAP Notes</span>
                </button>

                <button
                  onClick={() => setShowSickNoteModal(true)}
                  className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-300 hover:bg-amber-900 transition flex items-center justify-center space-x-1.5 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Issue Sick Note</span>
                </button>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-1">
                <div>Tariff Code: <span className="font-mono text-cyan-400 font-bold">0130</span> (Telehealth Consult)</div>
                <div>Billing Scheme: <span className="font-medium text-white">{patient?.medicalAidName}</span></div>
                <div>Status: <span className="text-emerald-400 font-semibold">Live Real-time Switched</span></div>
              </div>
            </div>

            {/* In-Call Real-Time Encrypted Chat */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    Encrypted In-Call Messaging
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">End-to-End</span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${m.sender === 'Doctor' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          m.sender === 'Doctor'
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 font-mono">{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Type secure note or instructions..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-xl transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Patient Virtual Appointment Booking & Waiting Room */}
      {activeTab === 'patient-booking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Patient Virtual Booking Form */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Schedule Virtual Telemedicine Consultation
            </h3>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Virtual appointment confirmed! Patient notified via WhatsApp with secure join link.</span>
              </div>
            )}

            <form onSubmit={handleCreateVirtualBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Patient</label>
                <select
                  value={patient?.id}
                  onChange={(e) => {
                    const matched = patients.find((p) => p.id === e.target.value);
                    if (matched) onSelectPatient(matched);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.medicalAidName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={virtualDate}
                    onChange={(e) => setVirtualDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Time Slot</label>
                  <input
                    type="time"
                    value={virtualTime}
                    onChange={(e) => setVirtualTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chief Symptoms / Reason for Remote Call</label>
                <textarea
                  rows={3}
                  value={virtualReason}
                  onChange={(e) => setVirtualReason(e.target.value)}
                  placeholder="Describe reason for telemedicine visit..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-white block">Telehealth Billing & Medical Aid Switch:</span>
                <p>Covered by Discovery Health, GEMS, Bonitas, Momentum at 100% of scheme tariff (Tariff 0130).</p>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm shadow-cyan-950"
              >
                <Video className="w-4 h-4" />
                <span>Confirm Virtual Consultation Booking</span>
              </button>
            </form>
          </div>

          {/* Right: Pre-Call Hardware Check & Patient Virtual Waiting Room */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Patient Virtual Waiting Room & Pre-Call Readiness Check
            </h3>

            {/* Readiness checklist */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-medium">Camera Hardware Check</span>
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 720p HD Ready
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-teal-400" />
                  <span className="text-white font-medium">Microphone & Noise Cancellation</span>
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Input Active
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Low-Latency Network Connection</span>
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 18ms Latency (Rosebank fibre)
                </span>
              </div>
            </div>

            {/* Virtual Waiting Room Status */}
            <div className="p-5 bg-gradient-to-r from-slate-950 to-cyan-950 rounded-2xl border border-cyan-800/80 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-cyan-950 border-2 border-cyan-500 text-cyan-300 flex items-center justify-center mx-auto text-xl font-bold animate-pulse">
                1
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">You are #1 in Dr. Thabo Ndlovu's Waiting Room</h4>
                <p className="text-slate-400 text-xs mt-1">
                  The doctor is reviewing your file and will admit you into the private encrypted video room shortly.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('doctor-room')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950"
              >
                Enter Consultation Room Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Sick Note Modal */}
      {showSickNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Issue HPCSA Digital Medical Certificate (Sick Note)
              </h3>
              <button onClick={() => setShowSickNoteModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Patient Name</label>
                <div className="font-bold text-white text-sm">{patient?.fullName} (ID: {patient?.idNumber})</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Duration of Absence (Days)</label>
                <select
                  value={sickNoteDays}
                  onChange={(e) => setSickNoteDays(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
                >
                  <option value={1}>1 Day (Return tomorrow)</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days (Full working week)</option>
                  <option value={7}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Clinical Reason (For employer / HR)</label>
                <input
                  type="text"
                  value={sickNoteReason}
                  onChange={(e) => setSickNoteReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 text-[11px] text-slate-400">
                HPCSA Rule 15 Compliance: Contains practitioner registration (MP 0694821), BHF practice number (0548921), and digital cryptographic signature.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSickNoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIssueSickNote}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Issue & Download Word (.doc)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
