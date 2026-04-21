import VisionCamera
import MLKitPoseDetectionAccurate
import MLKitPoseDetection
import MLKitVision

/**
 VisionCamera frame processor plugin for ML Kit Pose Detection on iOS.
 
 Registered as "detectPose" — called from JS frame processor:
   const result = detectPose(frame);
 
 Returns [[String: Any]] with 33 entries: { x, y, z, visibility }
 where x and y are normalised to 0–1.
 */
@objc(PoseDetectionPlugin)
public class PoseDetectionPlugin: FrameProcessorPlugin {
    
    private lazy var poseDetector: PoseDetector = {
        let options = AccuratePoseDetectorOptions()
        options.detectorMode = .stream
        return PoseDetector.poseDetector(options: options)
    }()
    
    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]? = nil) {
        super.init(proxy: proxy, options: options)
    }
    
    public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
        guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
            return nil
        }
        
        let ciImage = CIImage(cvPixelBuffer: imageBuffer)
        let width = CGFloat(CVPixelBufferGetWidth(imageBuffer))
        let height = CGFloat(CVPixelBufferGetHeight(imageBuffer))
        
        let image = VisionImage(buffer: frame.buffer)
        image.orientation = .up
        
        var results: [Any]? = nil
        
        do {
            let pose = try poseDetector.results(in: image)
            guard let detectedPose = pose.first else { return nil }
            
            let landmarks = detectedPose.landmarks
            if landmarks.isEmpty { return nil }
            
            var landmarkArray: [[String: Any]] = []
            
            // ML Kit returns landmarks in a specific type order. We iterate
            // through all possible pose landmark types (0..32) in order.
            for typeRaw in 0...32 {
                guard let type = PoseLandmarkType(rawValue: typeRaw) else {
                    // Unknown type — fill a zero-visibility placeholder
                    landmarkArray.append([
                        "x": 0.0,
                        "y": 0.0,
                        "z": 0.0,
                        "visibility": 0.0
                    ])
                    continue
                }
                
                let lm = detectedPose.landmark(ofType: type)
                landmarkArray.append([
                    "x": Double(lm.position.x / Float(width)),
                    "y": Double(lm.position.y / Float(height)),
                    "z": Double(lm.position.z),
                    "visibility": Double(lm.inFrameLikelihood)
                ])
            }
            
            results = landmarkArray
        } catch {
            return nil
        }
        
        return results
    }
}
